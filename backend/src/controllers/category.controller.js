const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');

// Helper function to create/update translation keys
const createOrUpdateTranslationKey = async (key, translations, entityType, entityId) => {
  if (!key || !translations) {
    console.warn('createOrUpdateTranslationKey: Missing key or translations', { key, translations });
    return;
  }

  try {
    console.log(`createOrUpdateTranslationKey: Updating key=${key}, entityType=${entityType}, entityId=${entityId}`);
    const translationPath = path.join(
      process.env.TRANSLATION_FILES_PATH || './locales',
      'ar',
      'translation.json'
    );

    // Ensure directory exists
    const dir = path.dirname(translationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing translations
    let translationData = {};
    if (fs.existsSync(translationPath)) {
      try {
        translationData = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
      } catch (parseError) {
        console.error('Error parsing Arabic translation file:', parseError);
        translationData = {};
      }
    }

    // Update translation
    translationData[key] = translations.ar || translations.arabic || '';

    // Write back to file
    fs.writeFileSync(translationPath, JSON.stringify(translationData, null, 2), 'utf8');

    // Also update English translations
    const enTranslationPath = path.join(
      process.env.TRANSLATION_FILES_PATH || './locales',
      'en',
      'translation.json'
    );

    const enDir = path.dirname(enTranslationPath);
    if (!fs.existsSync(enDir)) {
      fs.mkdirSync(enDir, { recursive: true });
    }

    let enTranslationData = {};
    if (fs.existsSync(enTranslationPath)) {
      try {
        enTranslationData = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));
      } catch (parseError) {
        console.error('Error parsing English translation file:', parseError);
        enTranslationData = {};
      }
    }

    enTranslationData[key] = translations.en || translations.english || '';

    fs.writeFileSync(enTranslationPath, JSON.stringify(enTranslationData, null, 2), 'utf8');

    // Create/update TranslationKey in database
    const translationKeyRecord = await prisma.translationKey.upsert({
      where: { key },
      update: {
        entityType,
        entityId,
        translations: JSON.stringify(translations)
      },
      create: {
        key,
        entityType,
        entityId,
        translations: JSON.stringify(translations)
      }
    });
    console.log(`createOrUpdateTranslationKey: Successfully saved translation key=${key}`);
    return translationKeyRecord;
  } catch (error) {
    console.error('Error in createOrUpdateTranslationKey:', error);
    console.error('Error details:', {
      key,
      entityType,
      entityId,
      translations,
      errorMessage: error.message,
      errorStack: error.stack
    });
    // Don't throw error, just log it - translation updates shouldn't break category updates
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const { includeInactive, featured } = req.query;
  const where = includeInactive === 'true' ? {} : { isActive: true };
  
  // Add featured filter if requested
  if (featured === 'true') {
    where.isFeatured = true;
  }
  
  const categories = await prisma.category.findMany({
    where,
    include: {
      parent: {
        select: {
          id: true,
          nameKey: true,
          slug: true
        }
      },
      _count: {
        select: {
          offers: true
        }
      },
      children: {
        where: includeInactive === 'true' ? {} : { isActive: true },
        include: {
          _count: {
            select: {
              offers: true
            }
          }
        }
      }
    },
    orderBy: featured === 'true' ? [{ isFeatured: 'desc' }, { displayOrder: 'asc' }] : { displayOrder: 'asc' }
  });

  successResponse(res, categories, 'Categories retrieved successfully');
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null // Only root categories
    },
    include: {
      children: {
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true }
          }
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  });

  successResponse(res, categories, 'Category tree retrieved successfully');
});

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: {
      parent: true,
      children: {
        where: { isActive: true }
      },
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  // Get translations from TranslationKey table
  const translationKeys = ['nameKey', 'descriptionKey', 'metaTitleKey', 'metaDescriptionKey', 'ogTitleKey', 'ogDescriptionKey', 'twitterCardTitleKey', 'twitterCardDescriptionKey'];
  const translations = {};
  
  for (const key of translationKeys) {
    if (category[key]) {
      try {
        const translationKey = await prisma.translationKey.findUnique({
          where: { key: category[key] }
        });
        if (translationKey && translationKey.translations) {
          const trans = JSON.parse(translationKey.translations);
          translations[key.replace('Key', 'Ar')] = trans.ar || '';
          translations[key.replace('Key', 'En')] = trans.en || '';
        }
      } catch (error) {
        console.error(`Error fetching translation for ${category[key]}:`, error);
      }
    }
  }

  // Add translations to category object
  const categoryWithTranslations = {
    ...category,
    ...translations
  };

  successResponse(res, categoryWithTranslations, 'Category retrieved successfully');
});

// @desc    Get sub-categories
// @route   GET /api/categories/:id/subcategories
// @access  Public
const getSubCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategories = await prisma.category.findMany({
    where: {
      parentId: parseInt(id),
      isActive: true
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  });

  successResponse(res, subCategories, 'Sub-categories retrieved successfully');
});

// @desc    Get products in category
// @route   GET /api/categories/:id/products
// @access  Public
const getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get all sub-category IDs
  const subCategories = await prisma.category.findMany({
    where: {
      parentId: parseInt(id),
      isActive: true
    },
    select: { id: true }
  });

  const categoryIds = [parseInt(id), ...subCategories.map(sc => sc.id)];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: 'AVAILABLE'
      },
      skip,
      take: parseInt(limit),
      include: {
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({
      where: {
        categoryId: { in: categoryIds },
        status: 'AVAILABLE'
      }
    })
  ]);

  successResponse(res, {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Products retrieved successfully');
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const {
    nameKey,
    nameAr,
    nameEn,
    descriptionKey,
    descriptionAr,
    descriptionEn,
    icon,
    imageUrl,
    parentId,
    displayOrder,
    isActive,
    metaTitleKey,
    metaTitleAr,
    metaTitleEn,
    metaDescriptionKey,
    metaDescriptionAr,
    metaDescriptionEn,
    metaKeywords,
    slug,
    canonicalUrl,
    ogTitleKey,
    ogTitleAr,
    ogTitleEn,
    ogDescriptionKey,
    ogDescriptionAr,
    ogDescriptionEn,
    ogImage,
    twitterCardTitleKey,
    twitterCardTitleAr,
    twitterCardTitleEn,
    twitterCardDescriptionKey,
    twitterCardDescriptionAr,
    twitterCardDescriptionEn,
    twitterCardImage,
    structuredData
  } = req.body;

  if ((!nameKey && (!nameAr || !nameEn)) || !slug) {
    return errorResponse(res, 'Please provide category name (in both Arabic and English) and slug', 400);
  }

  // Check if parent exists (if provided)
  let parent = null;
  if (parentId) {
    parent = await prisma.category.findUnique({
      where: { id: parseInt(parentId) }
    });

    if (!parent) {
      return errorResponse(res, 'Parent category not found', 404);
    }
  }

  // Generate translation keys if not provided
  const finalNameKey = nameKey || `category.name.${slug}`;
  const finalDescriptionKey = descriptionKey || `category.description.${slug}`;
  const finalMetaTitleKey = metaTitleKey || `category.meta.title.${slug}`;
  const finalMetaDescriptionKey = metaDescriptionKey || `category.meta.description.${slug}`;
  const finalOgTitleKey = ogTitleKey || `category.og.title.${slug}`;
  const finalOgDescriptionKey = ogDescriptionKey || `category.og.description.${slug}`;
  const finalTwitterCardTitleKey = twitterCardTitleKey || `category.twitter.title.${slug}`;
  const finalTwitterCardDescriptionKey = twitterCardDescriptionKey || `category.twitter.description.${slug}`;

  // Create translation keys
  if (nameAr !== undefined || nameEn !== undefined) {
    await createOrUpdateTranslationKey(finalNameKey, { ar: nameAr || '', en: nameEn || '' }, 'CATEGORY', null);
  }

  if (descriptionAr !== undefined || descriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalDescriptionKey, { ar: descriptionAr || '', en: descriptionEn || '' }, 'CATEGORY', null);
  }

  if (metaTitleAr !== undefined || metaTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalMetaTitleKey, { ar: metaTitleAr || '', en: metaTitleEn || '' }, 'CATEGORY', null);
  }

  if (metaDescriptionAr !== undefined || metaDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalMetaDescriptionKey, { ar: metaDescriptionAr || '', en: metaDescriptionEn || '' }, 'CATEGORY', null);
  }

  if (ogTitleAr !== undefined || ogTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalOgTitleKey, { ar: ogTitleAr || '', en: ogTitleEn || '' }, 'CATEGORY', null);
  }

  if (ogDescriptionAr !== undefined || ogDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalOgDescriptionKey, { ar: ogDescriptionAr || '', en: ogDescriptionEn || '' }, 'CATEGORY', null);
  }

  if (twitterCardTitleAr !== undefined || twitterCardTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalTwitterCardTitleKey, { ar: twitterCardTitleAr || '', en: twitterCardTitleEn || '' }, 'CATEGORY', null);
  }

  if (twitterCardDescriptionAr !== undefined || twitterCardDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalTwitterCardDescriptionKey, { ar: twitterCardDescriptionAr || '', en: twitterCardDescriptionEn || '' }, 'CATEGORY', null);
  }

  // Create category
  const category = await prisma.category.create({
    data: {
      nameKey: finalNameKey,
      descriptionKey: finalDescriptionKey,
      icon: icon || null,
      imageUrl: imageUrl || null,
      parentId: parentId ? parseInt(parentId) : null,
      level: parent ? (parent.level + 1) : 0,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      isActive: isActive !== undefined ? isActive : true,
      metaTitleKey: finalMetaTitleKey || null,
      metaDescriptionKey: finalMetaDescriptionKey || null,
      metaKeywords: metaKeywords || null,
      slug: slug,
      canonicalUrl: canonicalUrl || null,
      ogTitleKey: finalOgTitleKey || null,
      ogDescriptionKey: finalOgDescriptionKey || null,
      ogImage: ogImage || null,
      twitterCardTitleKey: finalTwitterCardTitleKey || null,
      twitterCardDescriptionKey: finalTwitterCardDescriptionKey || null,
      twitterCardImage: twitterCardImage || null,
      structuredData: structuredData || null
    }
  });

  // Get translations for response
  const categoryWithTranslations = { ...category };
  try {
    const nameTransKey = await prisma.translationKey.findUnique({ where: { key: finalNameKey } });
    if (nameTransKey && nameTransKey.translations) {
      const nameTrans = JSON.parse(nameTransKey.translations);
      categoryWithTranslations.nameAr = nameTrans.ar || '';
      categoryWithTranslations.nameEn = nameTrans.en || '';
    }
    if (finalDescriptionKey) {
      const descTransKey = await prisma.translationKey.findUnique({ where: { key: finalDescriptionKey } });
      if (descTransKey && descTransKey.translations) {
        const descTrans = JSON.parse(descTransKey.translations);
        categoryWithTranslations.descriptionAr = descTrans.ar || '';
        categoryWithTranslations.descriptionEn = descTrans.en || '';
      }
    }
  } catch (error) {
    console.error('Error fetching translations for response:', error);
  }

  successResponse(res, categoryWithTranslations, 'Category created successfully', 201);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameKey,
    nameAr,
    nameEn,
    descriptionKey,
    descriptionAr,
    descriptionEn,
    icon,
    imageUrl,
    parentId,
    displayOrder,
    isActive,
    metaTitleKey,
    metaTitleAr,
    metaTitleEn,
    metaDescriptionKey,
    metaDescriptionAr,
    metaDescriptionEn,
    metaKeywords,
    slug,
    canonicalUrl,
    ogTitleKey,
    ogTitleAr,
    ogTitleEn,
    ogDescriptionKey,
    ogDescriptionAr,
    ogDescriptionEn,
    ogImage,
    twitterCardTitleKey,
    twitterCardTitleAr,
    twitterCardTitleEn,
    twitterCardDescriptionKey,
    twitterCardDescriptionAr,
    twitterCardDescriptionEn,
    twitterCardImage,
    structuredData
  } = req.body;

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingCategory) {
    return errorResponse(res, 'Category not found', 404);
  }

  // Prepare update data first
  const data = {};

  // Get current category slug for translation key generation
  const currentSlug = existingCategory.slug || `category-${id}`;

  // Generate/update translation keys
  const finalNameKey = nameKey || existingCategory.nameKey || `category.name.${currentSlug}`;
  const finalDescriptionKey = descriptionKey || existingCategory.descriptionKey || `category.description.${currentSlug}`;
  const finalMetaTitleKey = metaTitleKey || existingCategory.metaTitleKey || `category.meta.title.${currentSlug}`;
  const finalMetaDescriptionKey = metaDescriptionKey || existingCategory.metaDescriptionKey || `category.meta.description.${currentSlug}`;
  const finalOgTitleKey = ogTitleKey || existingCategory.ogTitleKey || `category.og.title.${currentSlug}`;
  const finalOgDescriptionKey = ogDescriptionKey || existingCategory.ogDescriptionKey || `category.og.description.${currentSlug}`;
  const finalTwitterCardTitleKey = twitterCardTitleKey || existingCategory.twitterCardTitleKey || `category.twitter.title.${currentSlug}`;
  const finalTwitterCardDescriptionKey = twitterCardDescriptionKey || existingCategory.twitterCardDescriptionKey || `category.twitter.description.${currentSlug}`;

  // Update translation keys if provided
  if (nameAr !== undefined || nameEn !== undefined || nameKey !== undefined) {
    data.nameKey = finalNameKey;
    try {
      await createOrUpdateTranslationKey(finalNameKey, { ar: nameAr || '', en: nameEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating name translation:', error);
    }
  }

  if (descriptionAr !== undefined || descriptionEn !== undefined || descriptionKey !== undefined) {
    data.descriptionKey = finalDescriptionKey;
    try {
      await createOrUpdateTranslationKey(finalDescriptionKey, { ar: descriptionAr || '', en: descriptionEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating description translation:', error);
    }
  }

  if (metaTitleAr !== undefined || metaTitleEn !== undefined || metaTitleKey !== undefined) {
    data.metaTitleKey = finalMetaTitleKey;
    try {
      await createOrUpdateTranslationKey(finalMetaTitleKey, { ar: metaTitleAr || '', en: metaTitleEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating metaTitle translation:', error);
    }
  }

  if (metaDescriptionAr !== undefined || metaDescriptionEn !== undefined || metaDescriptionKey !== undefined) {
    data.metaDescriptionKey = finalMetaDescriptionKey;
    try {
      await createOrUpdateTranslationKey(finalMetaDescriptionKey, { ar: metaDescriptionAr || '', en: metaDescriptionEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating metaDescription translation:', error);
    }
  }

  if (ogTitleAr !== undefined || ogTitleEn !== undefined || ogTitleKey !== undefined) {
    data.ogTitleKey = finalOgTitleKey;
    try {
      await createOrUpdateTranslationKey(finalOgTitleKey, { ar: ogTitleAr || '', en: ogTitleEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating ogTitle translation:', error);
    }
  }

  if (ogDescriptionAr !== undefined || ogDescriptionEn !== undefined || ogDescriptionKey !== undefined) {
    data.ogDescriptionKey = finalOgDescriptionKey;
    try {
      await createOrUpdateTranslationKey(finalOgDescriptionKey, { ar: ogDescriptionAr || '', en: ogDescriptionEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating ogDescription translation:', error);
    }
  }

  if (twitterCardTitleAr !== undefined || twitterCardTitleEn !== undefined || twitterCardTitleKey !== undefined) {
    data.twitterCardTitleKey = finalTwitterCardTitleKey;
    try {
      await createOrUpdateTranslationKey(finalTwitterCardTitleKey, { ar: twitterCardTitleAr || '', en: twitterCardTitleEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating twitterCardTitle translation:', error);
    }
  }

  if (twitterCardDescriptionAr !== undefined || twitterCardDescriptionEn !== undefined || twitterCardDescriptionKey !== undefined) {
    data.twitterCardDescriptionKey = finalTwitterCardDescriptionKey;
    try {
      await createOrUpdateTranslationKey(finalTwitterCardDescriptionKey, { ar: twitterCardDescriptionAr || '', en: twitterCardDescriptionEn || '' }, 'CATEGORY', parseInt(id));
    } catch (error) {
      console.error('Error updating twitterCardDescription translation:', error);
    }
  }

  // Update other fields
  if (slug !== undefined && slug !== null && slug !== '') data.slug = slug;
  if (icon !== undefined) data.icon = icon || null;
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
  if (parentId !== undefined) {
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parseInt(parentId) }
      });
      if (!parent) {
        return errorResponse(res, 'Parent category not found', 404);
      }
      data.parentId = parseInt(parentId);
      data.level = parent.level + 1;
    } else {
      data.parentId = null;
      data.level = 0;
    }
  }
  if (displayOrder !== undefined) data.displayOrder = displayOrder ? parseInt(displayOrder) : 0;
  if (isActive !== undefined) data.isActive = isActive;
  if (metaKeywords !== undefined) data.metaKeywords = metaKeywords || null;
  if (canonicalUrl !== undefined) data.canonicalUrl = canonicalUrl || null;
  if (ogImage !== undefined) data.ogImage = ogImage || null;
  if (twitterCardImage !== undefined) data.twitterCardImage = twitterCardImage || null;
  if (structuredData !== undefined) data.structuredData = structuredData || null;

  console.log('Updating category with data:', JSON.stringify(data, null, 2));

  try {
    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data
    });

    // Get translations for response
    const categoryWithTranslations = { ...updated };
    try {
      if (data.nameKey || existingCategory.nameKey) {
        const nameTransKey = await prisma.translationKey.findUnique({ where: { key: data.nameKey || existingCategory.nameKey } });
        if (nameTransKey && nameTransKey.translations) {
          const nameTrans = JSON.parse(nameTransKey.translations);
          categoryWithTranslations.nameAr = nameTrans.ar || '';
          categoryWithTranslations.nameEn = nameTrans.en || '';
        }
      }
      if (data.descriptionKey || existingCategory.descriptionKey) {
        const descTransKey = await prisma.translationKey.findUnique({ where: { key: data.descriptionKey || existingCategory.descriptionKey } });
        if (descTransKey && descTransKey.translations) {
          const descTrans = JSON.parse(descTransKey.translations);
          categoryWithTranslations.descriptionAr = descTrans.ar || '';
          categoryWithTranslations.descriptionEn = descTrans.en || '';
        }
      }
    } catch (error) {
      console.error('Error fetching translations for response:', error);
    }

    return successResponse(res, categoryWithTranslations, 'Category updated successfully');
  } catch (error) {
    console.error('Error updating category in database:', error);
    return errorResponse(res, 'Failed to update category: ' + error.message, 500);
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          products: true,
          children: true
        }
      }
    }
  });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  if (category._count.products > 0) {
    return errorResponse(res, 'Cannot delete category with products', 400);
  }

  if (category._count.children > 0) {
    return errorResponse(res, 'Cannot delete category with sub-categories', 400);
  }

  await prisma.category.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Category deleted successfully');
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getSubCategories,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
};



