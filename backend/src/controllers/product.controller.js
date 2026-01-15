const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

    // Update translation - ALWAYS update even if empty string
    const arValue = translations.ar !== undefined ? translations.ar : (translations.arabic !== undefined ? translations.arabic : '');
    translationData[key] = arValue;
    console.log(`createOrUpdateTranslationKey: Setting Arabic translation for key=${key}: "${arValue}"`);

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

    // Update translation - ALWAYS update even if empty string
    const enValue = translations.en !== undefined ? translations.en : (translations.english !== undefined ? translations.english : '');
    enTranslationData[key] = enValue;
    console.log(`createOrUpdateTranslationKey: Setting English translation for key=${key}: "${enValue}"`);

    fs.writeFileSync(enTranslationPath, JSON.stringify(enTranslationData, null, 2), 'utf8');

    // Create/update TranslationKey in database
    // Ensure we use the correct translation values (from file updates above)
    const translationsToSave = {
      ar: arValue,
      en: enValue
    };
    
    console.log(`createOrUpdateTranslationKey: Saving to database - key=${key}, entityId=${entityId}, translations:`, {
      ar: translationsToSave.ar?.substring(0, 50) || '',
      en: translationsToSave.en?.substring(0, 50) || ''
    });
    
    const translationKeyRecord = await prisma.translationKey.upsert({
      where: { key },
      update: {
        entityType,
        entityId: entityId || null,
        translations: JSON.stringify(translationsToSave)
      },
      create: {
        key,
        entityType,
        entityId: entityId || null,
        translations: JSON.stringify(translationsToSave)
      }
    });
    console.log(`createOrUpdateTranslationKey: Successfully saved translation key=${key} to database`);
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
    // Return null to indicate failure, but don't throw to avoid breaking product updates
    return null;
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    categoryId,
    subcategoryId,
    vendorId,
    minPrice,
    maxPrice,
    minRating,
    status,
    country,
    city,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (categoryId) where.categoryId = parseInt(categoryId);
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (status) where.status = status;
  if (country) where.country = country;
  if (city) where.city = city;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  if (minRating) where.rating = { gte: parseFloat(minRating) };
  if (search) {
    where.OR = [
      { nameKey: { contains: search, mode: 'insensitive' } },
      { descriptionKey: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Handle sub-categories
  if (subcategoryId) {
    const subCategoryProducts = await prisma.productSubCategory.findMany({
      where: { categoryId: parseInt(subcategoryId) },
      select: { productId: true }
    });
    where.id = { in: subCategoryProducts.map(sp => sp.productId) };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            country: true,
            city: true
          }
        },
        category: {
          select: {
            id: true,
            nameKey: true
          }
        },
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        },
        _count: {
          select: {
            productReviews: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  paginatedResponse(res, products, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Products retrieved successfully');
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      vendor: {
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          country: true,
          city: true,
          rating: true,
          reviewCount: true,
          description: true,
          paymentTerms: true,
          shippingTerms: true,
          leadTime: true,
          isVerified: true,
          isActive: true,
          status: true
        }
      },
      category: true,
      subCategories: {
        include: {
          category: true
        }
      },
      images: {
        orderBy: { imageOrder: 'asc' }
      },
      productReviews: {
        where: { status: 'APPROVED' },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          productReviews: true
        }
      }
    }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Get translations from TranslationKey table
  const translationKeys = ['nameKey', 'descriptionKey', 'metaTitleKey', 'metaDescriptionKey', 'ogTitleKey', 'ogDescriptionKey', 'twitterCardTitleKey', 'twitterCardDescriptionKey'];
  const translations = {};
  
  for (const key of translationKeys) {
    if (product[key]) {
      try {
        const translationKey = await prisma.translationKey.findUnique({
          where: { key: product[key] }
        });
        if (translationKey && translationKey.translations) {
          const trans = JSON.parse(translationKey.translations);
          translations[key.replace('Key', 'Ar')] = trans.ar || '';
          translations[key.replace('Key', 'En')] = trans.en || '';
        }
      } catch (error) {
        console.error(`Error fetching translation for ${product[key]}:`, error);
      }
    }
  }

  // Add translations to product object
  const productWithTranslations = {
    ...product,
    ...translations
  };

  successResponse(res, productWithTranslations, 'Product retrieved successfully');
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (Vendor/Admin)
const createProduct = asyncHandler(async (req, res) => {
  const {
    // Basic fields
    nameKey,
    nameAr,
    nameEn,
    descriptionKey,
    descriptionAr,
    descriptionEn,
    sku,
    price,
    quantity,
    quantityPerCarton,
    cbm,
    minStockLevel,
    categoryId,
    country,
    city,
    acceptsNegotiation,
    subcategoryIds,
    isFeatured,
    // SEO fields
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

  if ((!nameKey && (!nameAr || !nameEn)) || !sku || !price || !categoryId || !country || !city) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  // Check if SKU already exists
  const existingProduct = await prisma.product.findUnique({
    where: { sku }
  });

  if (existingProduct) {
    return errorResponse(res, 'Product with this SKU already exists', 400);
  }

  const vendorId = req.userType === 'VENDOR' ? req.user.id : req.body.vendorId;

  if (!vendorId) {
    return errorResponse(res, 'Vendor ID is required', 400);
  }

  // Generate translation keys if not provided
  const finalNameKey = nameKey || `product.name.${sku}`;
  const finalDescriptionKey = descriptionKey || `product.description.${sku}`;
  const finalMetaTitleKey = metaTitleKey || `product.meta.title.${sku}`;
  const finalMetaDescriptionKey = metaDescriptionKey || `product.meta.description.${sku}`;
  const finalOgTitleKey = ogTitleKey || `product.og.title.${sku}`;
  const finalOgDescriptionKey = ogDescriptionKey || `product.og.description.${sku}`;
  const finalTwitterCardTitleKey = twitterCardTitleKey || `product.twitter.title.${sku}`;
  const finalTwitterCardDescriptionKey = twitterCardDescriptionKey || `product.twitter.description.${sku}`;

  // Create translation keys (always update if provided, even if empty string)
  if (nameAr !== undefined || nameEn !== undefined) {
    await createOrUpdateTranslationKey(finalNameKey, { ar: nameAr || '', en: nameEn || '' }, 'PRODUCT', null);
  }

  if (descriptionAr !== undefined || descriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalDescriptionKey, { ar: descriptionAr || '', en: descriptionEn || '' }, 'PRODUCT', null);
  }

  if (metaTitleAr !== undefined || metaTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalMetaTitleKey, { ar: metaTitleAr || '', en: metaTitleEn || '' }, 'PRODUCT', null);
  }

  if (metaDescriptionAr !== undefined || metaDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalMetaDescriptionKey, { ar: metaDescriptionAr || '', en: metaDescriptionEn || '' }, 'PRODUCT', null);
  }

  if (ogTitleAr !== undefined || ogTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalOgTitleKey, { ar: ogTitleAr || '', en: ogTitleEn || '' }, 'PRODUCT', null);
  }

  if (ogDescriptionAr !== undefined || ogDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalOgDescriptionKey, { ar: ogDescriptionAr || '', en: ogDescriptionEn || '' }, 'PRODUCT', null);
  }

  if (twitterCardTitleAr !== undefined || twitterCardTitleEn !== undefined) {
    await createOrUpdateTranslationKey(finalTwitterCardTitleKey, { ar: twitterCardTitleAr || '', en: twitterCardTitleEn || '' }, 'PRODUCT', null);
  }

  if (twitterCardDescriptionAr !== undefined || twitterCardDescriptionEn !== undefined) {
    await createOrUpdateTranslationKey(finalTwitterCardDescriptionKey, { ar: twitterCardDescriptionAr || '', en: twitterCardDescriptionEn || '' }, 'PRODUCT', null);
  }

  // Create product first
  const product = await prisma.product.create({
    data: {
      nameKey: finalNameKey,
      descriptionKey: finalDescriptionKey,
      sku,
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      quantityPerCarton: quantityPerCarton ? parseInt(quantityPerCarton) : null,
      cbm: cbm ? parseFloat(cbm) : null,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : null,
      categoryId: parseInt(categoryId),
      vendorId: parseInt(vendorId),
      country,
      city,
      acceptsNegotiation: acceptsNegotiation || false,
      isFeatured: isFeatured || false,
      status: req.userType === 'ADMIN' ? 'AVAILABLE' : 'PENDING_APPROVAL',
      metaTitleKey: finalMetaTitleKey,
      metaDescriptionKey: finalMetaDescriptionKey,
      metaKeywords,
      slug: slug || sku.toLowerCase().replace(/\s+/g, '-'),
      canonicalUrl,
      ogTitleKey: finalOgTitleKey,
      ogDescriptionKey: finalOgDescriptionKey,
      ogImage,
      twitterCardTitleKey: finalTwitterCardTitleKey,
      twitterCardDescriptionKey: finalTwitterCardDescriptionKey,
      twitterCardImage,
      structuredData
    },
    include: {
      vendor: {
        select: {
          id: true,
          companyName: true
        }
      },
      category: true
    }
  });

  // Add sub-categories if provided
  if (subcategoryIds && Array.isArray(subcategoryIds) && subcategoryIds.length > 0) {
    await prisma.productSubCategory.createMany({
      data: subcategoryIds.map(subCatId => ({
        productId: product.id,
        categoryId: parseInt(subCatId)
      }))
    });
  }

  // Update translation keys with product.id (entityId)
  const translationKeysToUpdate = [
    { key: finalNameKey, entityId: product.id },
    { key: finalDescriptionKey, entityId: product.id },
    { key: finalMetaTitleKey, entityId: product.id },
    { key: finalMetaDescriptionKey, entityId: product.id },
    { key: finalOgTitleKey, entityId: product.id },
    { key: finalOgDescriptionKey, entityId: product.id },
    { key: finalTwitterCardTitleKey, entityId: product.id },
    { key: finalTwitterCardDescriptionKey, entityId: product.id }
  ];

  for (const { key, entityId } of translationKeysToUpdate) {
    if (key) {
      try {
        await prisma.translationKey.updateMany({
          where: { key },
          data: { entityId }
        });
      } catch (error) {
        console.error(`Error updating translation key entityId for ${key}:`, error);
      }
    }
  }

  // Get translations for response
  const productWithTranslations = { ...product };
  try {
    if (finalNameKey) {
      const nameTransKey = await prisma.translationKey.findUnique({ where: { key: finalNameKey } });
      if (nameTransKey && nameTransKey.translations) {
        const nameTrans = JSON.parse(nameTransKey.translations);
        productWithTranslations.nameAr = nameTrans.ar || '';
        productWithTranslations.nameEn = nameTrans.en || '';
      }
    }
    if (finalDescriptionKey) {
      const descTransKey = await prisma.translationKey.findUnique({ where: { key: finalDescriptionKey } });
      if (descTransKey && descTransKey.translations) {
        const descTrans = JSON.parse(descTransKey.translations);
        productWithTranslations.descriptionAr = descTrans.ar || '';
        productWithTranslations.descriptionEn = descTrans.en || '';
      }
    }
  } catch (error) {
    console.error('Error fetching translations for response:', error);
  }

  successResponse(res, productWithTranslations, 'Product created successfully', 201);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor/Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('=== UPDATE PRODUCT REQUEST ===');
  console.log('Product ID:', id);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  const {
    // Basic fields
    nameKey,
    nameAr,
    nameEn,
    descriptionKey,
    descriptionAr,
    descriptionEn,
    sku,
    price,
    quantity,
    quantityPerCarton,
    cbm,
    minStockLevel,
    categoryId,
    country,
    city,
    acceptsNegotiation,
    subcategoryIds,
    isFeatured,
    status,
    // SEO fields
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

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingProduct) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check ownership (vendor can only update their own products)
  if (req.userType === 'VENDOR' && existingProduct.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this product', 403);
  }

  // Prepare update data first
  const data = {};

  // Get current product SKU for translation key generation
  const currentSku = existingProduct.sku;

  // Generate/update translation keys
  const finalNameKey = nameKey || existingProduct.nameKey || `product.name.${currentSku}`;
  const finalDescriptionKey = descriptionKey || existingProduct.descriptionKey || `product.description.${currentSku}`;
  const finalMetaTitleKey = metaTitleKey || existingProduct.metaTitleKey || `product.meta.title.${currentSku}`;
  const finalMetaDescriptionKey = metaDescriptionKey || existingProduct.metaDescriptionKey || `product.meta.description.${currentSku}`;
  const finalOgTitleKey = ogTitleKey || existingProduct.ogTitleKey || `product.og.title.${currentSku}`;
  const finalOgDescriptionKey = ogDescriptionKey || existingProduct.ogDescriptionKey || `product.og.description.${currentSku}`;
  const finalTwitterCardTitleKey = twitterCardTitleKey || existingProduct.twitterCardTitleKey || `product.twitter.title.${currentSku}`;
  const finalTwitterCardDescriptionKey = twitterCardDescriptionKey || existingProduct.twitterCardDescriptionKey || `product.twitter.description.${currentSku}`;

  // Update translation keys if provided (ALWAYS update if nameAr or nameEn is in request body)
  // Always update translations if fields are present in request body
  const hasNameAr = req.body.hasOwnProperty('nameAr');
  const hasNameEn = req.body.hasOwnProperty('nameEn');
  const hasDescriptionAr = req.body.hasOwnProperty('descriptionAr');
  const hasDescriptionEn = req.body.hasOwnProperty('descriptionEn');

  console.log('Translation update check:', {
    hasNameAr,
    hasNameEn,
    hasDescriptionAr,
    hasDescriptionEn,
    nameAr: req.body.nameAr,
    nameEn: req.body.nameEn,
    descriptionAr: req.body.descriptionAr ? req.body.descriptionAr.substring(0, 50) + '...' : '',
    descriptionEn: req.body.descriptionEn ? req.body.descriptionEn.substring(0, 50) + '...' : ''
  });

  // Always update name translations if nameAr or nameEn are in request
  if (hasNameAr || hasNameEn) {
    data.nameKey = finalNameKey;
    
    try {
      // Get current translations to preserve the other language if only one is updated
      let finalNameAr = hasNameAr ? (req.body.nameAr || '') : '';
      let finalNameEn = hasNameEn ? (req.body.nameEn || '') : '';
      
      // If only one language is provided, get the other from existing translation
      if (hasNameAr && !hasNameEn) {
        try {
          const existingTrans = await prisma.translationKey.findUnique({ where: { key: finalNameKey } });
          if (existingTrans && existingTrans.translations) {
            const trans = JSON.parse(existingTrans.translations);
            finalNameEn = trans.en || '';
            console.log(`Preserved English translation: ${finalNameEn}`);
          }
        } catch (e) {
          console.error('Error getting existing English translation:', e);
        }
      } else if (!hasNameAr && hasNameEn) {
        try {
          const existingTrans = await prisma.translationKey.findUnique({ where: { key: finalNameKey } });
          if (existingTrans && existingTrans.translations) {
            const trans = JSON.parse(existingTrans.translations);
            finalNameAr = trans.ar || '';
            console.log(`Preserved Arabic translation: ${finalNameAr}`);
          }
        } catch (e) {
          console.error('Error getting existing Arabic translation:', e);
        }
      }
      
      console.log(`Updating name translation: key=${finalNameKey}, ar="${finalNameAr}", en="${finalNameEn}"`);
      
      const result = await createOrUpdateTranslationKey(finalNameKey, { ar: finalNameAr, en: finalNameEn }, 'PRODUCT', parseInt(id));
      console.log(`Name translation updated successfully, result:`, result ? 'OK' : 'FAILED');
    } catch (error) {
      console.error('Error updating name translation:', error);
      console.error('Error stack:', error.stack);
      // Continue even if translation update fails - nameKey is already set
    }
  } else if (nameKey !== undefined) {
    // If only nameKey is provided, still update it in product
    data.nameKey = finalNameKey;
  }

  // Always update description translations if descriptionAr or descriptionEn are in request
  if (hasDescriptionAr || hasDescriptionEn) {
    data.descriptionKey = finalDescriptionKey;
    
    try {
      // Get current translations to preserve the other language if only one is updated
      let finalDescriptionAr = hasDescriptionAr ? (req.body.descriptionAr || '') : '';
      let finalDescriptionEn = hasDescriptionEn ? (req.body.descriptionEn || '') : '';
      
      // If only one language is provided, get the other from existing translation
      if (hasDescriptionAr && !hasDescriptionEn) {
        try {
          const existingTrans = await prisma.translationKey.findUnique({ where: { key: finalDescriptionKey } });
          if (existingTrans && existingTrans.translations) {
            const trans = JSON.parse(existingTrans.translations);
            finalDescriptionEn = trans.en || '';
            console.log(`Preserved English description`);
          }
        } catch (e) {
          console.error('Error getting existing English description:', e);
        }
      } else if (!hasDescriptionAr && hasDescriptionEn) {
        try {
          const existingTrans = await prisma.translationKey.findUnique({ where: { key: finalDescriptionKey } });
          if (existingTrans && existingTrans.translations) {
            const trans = JSON.parse(existingTrans.translations);
            finalDescriptionAr = trans.ar || '';
            console.log(`Preserved Arabic description`);
          }
        } catch (e) {
          console.error('Error getting existing Arabic description:', e);
        }
      }
      
      console.log(`Updating description translation: key=${finalDescriptionKey}, ar length=${finalDescriptionAr?.length || 0}, en length=${finalDescriptionEn?.length || 0}`);
      
      const result = await createOrUpdateTranslationKey(finalDescriptionKey, { ar: finalDescriptionAr, en: finalDescriptionEn }, 'PRODUCT', parseInt(id));
      console.log(`Description translation updated successfully, result:`, result ? 'OK' : 'FAILED');
    } catch (error) {
      console.error('Error updating description translation:', error);
      console.error('Error stack:', error.stack);
      // Continue even if translation update fails - descriptionKey is already set
    }
  } else if (descriptionKey !== undefined) {
    // If only descriptionKey is provided, still update it in product
    data.descriptionKey = finalDescriptionKey;
  }

  if (metaTitleAr !== undefined || metaTitleEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalMetaTitleKey, { ar: metaTitleAr || '', en: metaTitleEn || '' }, 'PRODUCT', parseInt(id));
      data.metaTitleKey = finalMetaTitleKey;
    } catch (error) {
      console.error('Error updating metaTitle translation:', error);
    }
  }

  if (metaDescriptionAr !== undefined || metaDescriptionEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalMetaDescriptionKey, { ar: metaDescriptionAr || '', en: metaDescriptionEn || '' }, 'PRODUCT', parseInt(id));
      data.metaDescriptionKey = finalMetaDescriptionKey;
    } catch (error) {
      console.error('Error updating metaDescription translation:', error);
    }
  }

  if (ogTitleAr !== undefined || ogTitleEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalOgTitleKey, { ar: ogTitleAr || '', en: ogTitleEn || '' }, 'PRODUCT', parseInt(id));
      data.ogTitleKey = finalOgTitleKey;
    } catch (error) {
      console.error('Error updating ogTitle translation:', error);
    }
  }

  if (ogDescriptionAr !== undefined || ogDescriptionEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalOgDescriptionKey, { ar: ogDescriptionAr || '', en: ogDescriptionEn || '' }, 'PRODUCT', parseInt(id));
      data.ogDescriptionKey = finalOgDescriptionKey;
    } catch (error) {
      console.error('Error updating ogDescription translation:', error);
    }
  }

  if (twitterCardTitleAr !== undefined || twitterCardTitleEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalTwitterCardTitleKey, { ar: twitterCardTitleAr || '', en: twitterCardTitleEn || '' }, 'PRODUCT', parseInt(id));
      data.twitterCardTitleKey = finalTwitterCardTitleKey;
    } catch (error) {
      console.error('Error updating twitterCardTitle translation:', error);
    }
  }

  if (twitterCardDescriptionAr !== undefined || twitterCardDescriptionEn !== undefined) {
    try {
      await createOrUpdateTranslationKey(finalTwitterCardDescriptionKey, { ar: twitterCardDescriptionAr || '', en: twitterCardDescriptionEn || '' }, 'PRODUCT', parseInt(id));
      data.twitterCardDescriptionKey = finalTwitterCardDescriptionKey;
    } catch (error) {
      console.error('Error updating twitterCardDescription translation:', error);
    }
  }
  // Always update these fields if provided (even if empty strings for nullable fields)
  if (sku !== undefined && sku !== null && sku !== '') data.sku = sku;
  // nameKey and descriptionKey are already set above if translations are provided
  if (price !== undefined) data.price = parseFloat(price);
  if (quantity !== undefined) data.quantity = parseInt(quantity);
  if (quantityPerCarton !== undefined) {
    data.quantityPerCarton = quantityPerCarton && quantityPerCarton !== '' ? parseInt(quantityPerCarton) : null;
  }
  if (cbm !== undefined) {
    data.cbm = cbm && cbm !== '' ? parseFloat(cbm) : null;
  }
  if (minStockLevel !== undefined) {
    data.minStockLevel = minStockLevel && minStockLevel !== '' ? parseInt(minStockLevel) : null;
  }
  if (categoryId !== undefined && categoryId !== '') data.categoryId = parseInt(categoryId);
  // Only allow admin to change vendorId
  if (req.body.vendorId !== undefined && req.body.vendorId !== '' && req.userType === 'ADMIN') {
    data.vendorId = parseInt(req.body.vendorId);
  }
  // Always update country and city if provided (even if empty strings)
  if (country !== undefined) data.country = country || null;
  if (city !== undefined) data.city = city || null;
  if (acceptsNegotiation !== undefined) data.acceptsNegotiation = acceptsNegotiation;
  if (isFeatured !== undefined) data.isFeatured = isFeatured;
  if (status !== undefined && req.userType === 'ADMIN') data.status = status;
  // Update SEO fields if provided (even if empty strings)
  if (metaTitleKey !== undefined) data.metaTitleKey = finalMetaTitleKey;
  if (metaDescriptionKey !== undefined) data.metaDescriptionKey = finalMetaDescriptionKey;
  if (metaKeywords !== undefined) data.metaKeywords = metaKeywords || null;
  if (slug !== undefined) data.slug = slug || null;
  if (canonicalUrl !== undefined) data.canonicalUrl = canonicalUrl || null;
  if (ogTitleKey !== undefined) data.ogTitleKey = finalOgTitleKey;
  if (ogDescriptionKey !== undefined) data.ogDescriptionKey = finalOgDescriptionKey;
  if (ogImage !== undefined) data.ogImage = ogImage || null;
  if (twitterCardTitleKey !== undefined) data.twitterCardTitleKey = finalTwitterCardTitleKey;
  if (twitterCardDescriptionKey !== undefined) data.twitterCardDescriptionKey = finalTwitterCardDescriptionKey;
  if (twitterCardImage !== undefined) data.twitterCardImage = twitterCardImage || null;
  if (structuredData !== undefined) data.structuredData = structuredData || null;

  console.log('Updating product with data:', JSON.stringify(data, null, 2));
  
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data,
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        },
        category: true
      }
    });

    console.log('Product updated successfully:', product.id);
    
    // Return product with translations
    const productWithTranslations = { ...product };
    
    // Always get translations from TranslationKey table - fetch them fresh after update
    const translationKeysToFetch = [
      { key: 'nameKey', translationKey: product.nameKey || finalNameKey },
      { key: 'descriptionKey', translationKey: product.descriptionKey || finalDescriptionKey },
      { key: 'metaTitleKey', translationKey: product.metaTitleKey },
      { key: 'metaDescriptionKey', translationKey: product.metaDescriptionKey },
      { key: 'ogTitleKey', translationKey: product.ogTitleKey },
      { key: 'ogDescriptionKey', translationKey: product.ogDescriptionKey },
      { key: 'twitterCardTitleKey', translationKey: product.twitterCardTitleKey },
      { key: 'twitterCardDescriptionKey', translationKey: product.twitterCardDescriptionKey }
    ];
    
    console.log('Fetching translations for response...');
    for (const { key, translationKey } of translationKeysToFetch) {
      if (translationKey) {
        try {
          const transKey = await prisma.translationKey.findUnique({
            where: { key: translationKey }
          });
          if (transKey && transKey.translations) {
            const trans = JSON.parse(transKey.translations);
            productWithTranslations[key.replace('Key', 'Ar')] = trans.ar || '';
            productWithTranslations[key.replace('Key', 'En')] = trans.en || '';
            console.log(`Fetched ${key}: ar="${trans.ar?.substring(0, 30) || ''}...", en="${trans.en?.substring(0, 30) || ''}..."`);
          } else {
            console.log(`Translation key ${translationKey} not found in database`);
          }
        } catch (error) {
          console.error(`Error fetching translation for ${translationKey}:`, error);
        }
      }
    }
    
    console.log('Final product with translations:', {
      nameAr: productWithTranslations.nameAr,
      nameEn: productWithTranslations.nameEn,
      descriptionAr: productWithTranslations.descriptionAr?.substring(0, 50),
      descriptionEn: productWithTranslations.descriptionEn?.substring(0, 50)
    });
    
    // Verify translations were saved correctly by reading them back from DB
    try {
      if (finalNameKey) {
        const verifyTrans = await prisma.translationKey.findUnique({ where: { key: finalNameKey } });
        if (verifyTrans && verifyTrans.translations) {
          const verifyParsed = JSON.parse(verifyTrans.translations);
          console.log('=== VERIFICATION - Name translations in DB ===');
          console.log('AR:', verifyParsed.ar);
          console.log('EN:', verifyParsed.en);
        } else {
          console.log(`WARNING: Translation key ${finalNameKey} not found in database after update!`);
        }
      }
      if (finalDescriptionKey) {
        const verifyTrans = await prisma.translationKey.findUnique({ where: { key: finalDescriptionKey } });
        if (verifyTrans && verifyTrans.translations) {
          const verifyParsed = JSON.parse(verifyTrans.translations);
          console.log('=== VERIFICATION - Description translations in DB ===');
          console.log('AR:', verifyParsed.ar?.substring(0, 100));
          console.log('EN:', verifyParsed.en?.substring(0, 100));
        } else {
          console.log(`WARNING: Translation key ${finalDescriptionKey} not found in database after update!`);
        }
      }
    } catch (verifyError) {
      console.error('Error verifying translations:', verifyError);
    }

    // Update sub-categories if provided
    if (subcategoryIds && Array.isArray(subcategoryIds)) {
      // Delete existing sub-categories
      await prisma.productSubCategory.deleteMany({
        where: { productId: parseInt(id) }
      });

      // Add new sub-categories
      if (subcategoryIds.length > 0) {
        await prisma.productSubCategory.createMany({
          data: subcategoryIds.map(subCatId => ({
            productId: parseInt(id),
            categoryId: parseInt(subCatId)
          }))
        });
      }
    }

    return successResponse(res, productWithTranslations, 'Product updated successfully');
  } catch (error) {
    console.error('Error updating product in database:', error);
    return errorResponse(res, 'Failed to update product: ' + error.message, 500);
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor/Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    return errorResponse(res, 'Invalid product ID', 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: {
        select: {
          orderItems: true,
          cartItems: true,
          checkoutItems: true
        }
      }
    }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check ownership (vendor can only delete their own products)
  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to delete this product', 403);
  }

  // Check if product is in orders (cannot delete if in completed orders)
  if (product._count.orderItems > 0) {
    // Check if any orders with this product are completed or delivered
    const ordersWithProduct = await prisma.orderItem.findMany({
      where: { productId: productId },
      include: {
        order: {
          select: {
            status: true
          }
        }
      }
    });

    const hasCompletedOrders = ordersWithProduct.some(item => 
      ['DELIVERED', 'COMPLETED'].includes(item.order.status)
    );

    if (hasCompletedOrders) {
      return errorResponse(res, 'Cannot delete product that has been sold. Consider marking it as unavailable instead.', 400);
    }
  }

  // Delete related data in transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Delete product images (already has cascade, but explicit for clarity)
      await tx.productImage.deleteMany({
        where: { productId: productId }
      });

      // Delete product sub-categories (already has cascade)
      await tx.productSubCategory.deleteMany({
        where: { productId: productId }
      });

      // Delete cart items (remove from carts)
      await tx.cartItem.deleteMany({
        where: { productId: productId }
      });

      // Delete checkout items (remove from checkout sessions)
      await tx.checkoutItem.deleteMany({
        where: { productId: productId }
      });

      // Delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { productId: productId }
      });

      // Delete negotiations
      await tx.negotiation.deleteMany({
        where: { productId: productId }
      });

      // Delete price requests
      await tx.priceRequest.deleteMany({
        where: { productId: productId }
      });

      // Delete product offers
      await tx.productOffer.deleteMany({
        where: { productId: productId }
      });

      // Delete product reviews
      await tx.productReview.deleteMany({
        where: { productId: productId }
      });

      // Delete SEO analytics
      await tx.sEOAnalytics.deleteMany({
        where: { 
          productId: productId
        }
      });

      // Delete order items (only if orders are not completed)
      await tx.orderItem.deleteMany({
        where: { 
          productId: productId,
          order: {
            status: {
              notIn: ['DELIVERED', 'COMPLETED']
            }
          }
        }
      });

      // Delete the product itself
      await tx.product.delete({
        where: { id: productId }
      });
    });

    successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Check if it's a foreign key constraint error
    if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
      return errorResponse(res, 'Cannot delete product: it is referenced by orders or other records. Consider marking it as unavailable instead.', 400);
    }
    
    return errorResponse(res, 'Failed to delete product: ' + error.message, 500);
  }
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    select: { categoryId: true, vendorId: true }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: parseInt(id) },
      status: 'AVAILABLE',
      OR: [
        { categoryId: product.categoryId },
        { vendorId: product.vendorId }
      ]
    },
    take: limit,
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
  });

  successResponse(res, relatedProducts, 'Related products retrieved successfully');
});

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
const getProductsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        vendorId: parseInt(sellerId),
        status: 'AVAILABLE'
      },
      skip,
      take: parseInt(limit),
      include: {
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({
      where: {
        vendorId: parseInt(sellerId),
        status: 'AVAILABLE'
      }
    })
  ]);

  paginatedResponse(res, products, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Products retrieved successfully');
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Vendor/Admin)
const uploadProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { getFileUrl } = require('../services/upload.service');

  // Check if product exists and ownership
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Support both file uploads and URL-based images
  let images = [];
  
  // If files are uploaded via multer
  if (req.files && req.files.length > 0) {
    const imageData = req.body.imageData ? JSON.parse(req.body.imageData) : [];
    images = req.files.map((file, index) => {
      const data = imageData[index] || {};
      return {
        imageUrl: getFileUrl(file.path) || `/uploads/products/${file.filename}`,
        imageOrder: data.imageOrder || index + 1,
        isPrimary: data.isPrimary === 'true' || data.isPrimary === true,
        altText: data.altText || file.originalname
      };
    });
  } 
  // If images are provided as URLs in body (backward compatibility)
  else if (req.body.images && Array.isArray(req.body.images)) {
    images = req.body.images;
  } 
  else {
    return errorResponse(res, 'Please provide images (files or URLs)', 400);
  }

  // Check existing image count
  const existingImages = await prisma.productImage.count({
    where: { productId: parseInt(id) }
  });

  if (existingImages + images.length > 10) {
    return errorResponse(res, 'Maximum 10 images allowed per product', 400);
  }

  // Create image records
  const createdImages = await prisma.productImage.createMany({
    data: images.map((img, index) => ({
      productId: parseInt(id),
      imageUrl: img.imageUrl,
      imageOrder: img.imageOrder || existingImages + index + 1,
      isPrimary: img.isPrimary || false,
      altText: img.altText || null
    }))
  });

  // If any image is marked as primary, unset others
  const hasPrimary = images.some(img => img.isPrimary);
  if (hasPrimary) {
    // Get the newly created images
    const newImageRecords = await prisma.productImage.findMany({
      where: {
        productId: parseInt(id),
        imageUrl: { in: images.map(img => img.imageUrl) }
      }
    });

    // Unset primary for all other images
    await prisma.productImage.updateMany({
      where: {
        productId: parseInt(id),
        id: { notIn: newImageRecords.filter(img => img.isPrimary).map(img => img.id) }
      },
      data: { isPrimary: false }
    });
  }

  // Return created images
  const createdImageRecords = await prisma.productImage.findMany({
    where: {
      productId: parseInt(id),
      imageUrl: { in: images.map(img => img.imageUrl) }
    },
    orderBy: { imageOrder: 'asc' }
  });

  successResponse(res, { images: createdImageRecords, count: createdImages.count }, 'Images uploaded successfully', 201);
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Vendor/Admin)
const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  // Check if product exists and ownership
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Check if image exists
  const image = await prisma.productImage.findFirst({
    where: {
      id: parseInt(imageId),
      productId: parseInt(id)
    }
  });

  if (!image) {
    return errorResponse(res, 'Image not found', 404);
  }

  await prisma.productImage.delete({
    where: { id: parseInt(imageId) }
  });

  successResponse(res, null, 'Image deleted successfully');
});

// @desc    Approve product (Admin only)
// @route   PUT /api/products/:id/approve
// @access  Private (Admin)
const approveProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.userType !== 'ADMIN') {
    return errorResponse(res, 'Not authorized. Admin access required', 403);
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: req.user.id
    }
  });

  successResponse(res, updatedProduct, 'Product approved successfully');
});

// @desc    Reject product (Admin only)
// @route   PUT /api/products/:id/reject
// @access  Private (Admin)
const rejectProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (req.userType !== 'ADMIN') {
    return errorResponse(res, 'Not authorized. Admin access required', 403);
  }

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
      rejectionReason: reason || 'No reason provided'
    }
  });

  successResponse(res, updatedProduct, 'Product rejected successfully');
});

// @desc    Export products to CSV
// @route   GET /api/products/export
// @access  Private (Vendor/Admin)
const exportProducts = asyncHandler(async (req, res) => {
  const { categoryId, status, vendorId } = req.query;
  
  // Build where clause
  const where = {};
  
  // Vendor can only export their own products
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  } else if (vendorId) {
    where.vendorId = parseInt(vendorId);
  }
  
  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }
  
  if (status) {
    where.status = status;
  }

  // Fetch products with related data
  const products = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: { nameKey: true }
      },
      vendor: {
        select: { companyName: true, email: true }
      },
      images: {
        select: { imageUrl: true, isPrimary: true, imageOrder: true },
        orderBy: { imageOrder: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (products.length === 0) {
    return errorResponse(res, 'No products found to export', 404);
  }

  // Prepare CSV data
  const csvData = products.map(product => {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    const allImages = product.images.map(img => img.imageUrl).join(';');
    
    return {
      'SKU': product.sku || '',
      'Name (Arabic)': product.nameAr || '',
      'Name (English)': product.nameEn || '',
      'Description (Arabic)': (product.descriptionAr || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Description (English)': (product.descriptionEn || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Price': product.price || 0,
      'Quantity': product.quantity || 0,
      'Quantity Per Carton': product.quantityPerCarton || '',
      'CBM': product.cbm || '',
      'Min Stock Level': product.minStockLevel || '',
      'Category': product.category?.nameKey || '',
      'Vendor': product.vendor?.companyName || product.vendor?.email || '',
      'Country': product.country || '',
      'City': product.city || '',
      'Status': product.status || '',
      'Is Featured': product.isFeatured ? 'Yes' : 'No',
      'Accepts Negotiation': product.acceptsNegotiation ? 'Yes' : 'No',
      'Primary Image URL': primaryImage?.imageUrl || '',
      'All Image URLs': allImages || '',
      'Meta Title (Arabic)': product.metaTitleAr || '',
      'Meta Title (English)': product.metaTitleEn || '',
      'Meta Description (Arabic)': (product.metaDescriptionAr || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Meta Description (English)': (product.metaDescriptionEn || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Meta Keywords': product.metaKeywords || '',
      'Slug': product.slug || '',
      'Canonical URL': product.canonicalUrl || '',
      'OG Title (Arabic)': product.ogTitleAr || '',
      'OG Title (English)': product.ogTitleEn || '',
      'OG Description (Arabic)': (product.ogDescriptionAr || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'OG Description (English)': (product.ogDescriptionEn || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'OG Image URL': product.ogImage || '',
      'Twitter Title (Arabic)': product.twitterCardTitleAr || '',
      'Twitter Title (English)': product.twitterCardTitleEn || '',
      'Twitter Description (Arabic)': (product.twitterCardDescriptionAr || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Twitter Description (English)': (product.twitterCardDescriptionEn || '').replace(/\n/g, ' ').replace(/,/g, ';'),
      'Twitter Image URL': product.twitterCardImage || '',
      'Structured Data': product.structuredData || ''
    };
  });

  // Define CSV headers
  const headers = Object.keys(csvData[0]).map(key => ({ id: key, title: key }));

  // Create CSV writer
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '..', '..', 'temp', `products-export-${Date.now()}.csv`),
    header: headers
  });

  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Write CSV file
  await csvWriter.writeRecords(csvData);

  // Read and send file
  const filePath = csvWriter.path;
  const fileName = `products-export-${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  // Clean up file after sending
  fileStream.on('end', () => {
    fs.unlinkSync(filePath);
  });
});

// @desc    Download CSV template
// @route   GET /api/products/export/template
// @access  Private (Vendor/Admin)
const downloadTemplate = asyncHandler(async (req, res) => {
  const templateData = [{
    'SKU': 'PROD-001',
    'Name (Arabic)': 'اسم المنتج',
    'Name (English)': 'Product Name',
    'Description (Arabic)': 'وصف المنتج بالعربية',
    'Description (English)': 'Product description in English',
    'Price': '100.00',
    'Quantity': '100',
    'Quantity Per Carton': '10',
    'CBM': '0.5',
    'Min Stock Level': '10',
    'Category': 'Category Name',
    'Vendor': 'Vendor Company Name',
    'Country': 'Saudi Arabia',
    'City': 'Riyadh',
    'Status': 'PENDING_APPROVAL',
    'Is Featured': 'No',
    'Accepts Negotiation': 'Yes',
    'Primary Image URL': 'https://example.com/image.jpg',
    'All Image URLs': 'https://example.com/image1.jpg;https://example.com/image2.jpg',
    'Meta Title (Arabic)': 'عنوان SEO',
    'Meta Title (English)': 'SEO Title',
    'Meta Description (Arabic)': 'وصف SEO',
    'Meta Description (English)': 'SEO Description',
    'Meta Keywords': 'keyword1, keyword2',
    'Slug': 'product-slug',
    'Canonical URL': 'https://example.com/product',
    'OG Title (Arabic)': 'عنوان OG',
    'OG Title (English)': 'OG Title',
    'OG Description (Arabic)': 'وصف OG',
    'OG Description (English)': 'OG Description',
    'OG Image URL': 'https://example.com/og-image.jpg',
    'Twitter Title (Arabic)': 'عنوان تويتر',
    'Twitter Title (English)': 'Twitter Title',
    'Twitter Description (Arabic)': 'وصف تويتر',
    'Twitter Description (English)': 'Twitter Description',
    'Twitter Image URL': 'https://example.com/twitter-image.jpg',
    'Structured Data': '{"@context":"https://schema.org","@type":"Product"}'
  }];

  const headers = Object.keys(templateData[0]).map(key => ({ id: key, title: key }));

  const csvWriter = createCsvWriter({
    path: path.join(__dirname, '..', '..', 'temp', `products-template-${Date.now()}.csv`),
    header: headers
  });

  const tempDir = path.join(__dirname, '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  await csvWriter.writeRecords(templateData);

  const filePath = csvWriter.path;
  const fileName = 'products-template.csv';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    fs.unlinkSync(filePath);
  });
});

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private (Vendor/Admin)
const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No CSV file uploaded', 400);
  }

  const results = [];
  const errors = [];
  let rowNumber = 0;

  // Read and parse CSV file
  return new Promise((resolve, reject) => {
    const filePath = req.file.path;
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        try {
          // Process each row
          for (const row of rows) {
            rowNumber++;
            
            try {
              // Validate required fields
              if (!row['SKU'] || !row['Name (Arabic)'] || !row['Name (English)']) {
                errors.push({
                  row: rowNumber,
                  sku: row['SKU'] || 'N/A',
                  error: 'Missing required fields: SKU, Name (Arabic), or Name (English)'
                });
                continue;
              }

              // Get or create category
              let category = null;
              if (row['Category']) {
                category = await prisma.category.findFirst({
                  where: {
                    OR: [
                      { nameKey: row['Category'] },
                      { nameAr: row['Category'] },
                      { nameEn: row['Category'] }
                    ]
                  }
                });

                if (!category) {
                  errors.push({
                    row: rowNumber,
                    sku: row['SKU'],
                    error: `Category not found: ${row['Category']}`
                  });
                  continue;
                }
              }

              // Get vendor (for vendor, use their own ID; for admin, find by name/email)
              let vendor = null;
              if (req.userType === 'VENDOR') {
                vendor = await prisma.vendor.findUnique({
                  where: { id: req.user.id }
                });
              } else if (row['Vendor']) {
                vendor = await prisma.vendor.findFirst({
                  where: {
                    OR: [
                      { companyName: row['Vendor'] },
                      { email: row['Vendor'] }
                    ]
                  }
                });

                if (!vendor) {
                  errors.push({
                    row: rowNumber,
                    sku: row['SKU'],
                    error: `Vendor not found: ${row['Vendor']}`
                  });
                  continue;
                }
              }

              // Check if product already exists
              const existingProduct = await prisma.product.findFirst({
                where: { sku: row['SKU'] }
              });

              const productData = {
                sku: row['SKU'],
                nameAr: row['Name (Arabic)'],
                nameEn: row['Name (English)'],
                descriptionAr: row['Description (Arabic)'] || '',
                descriptionEn: row['Description (English)'] || '',
                price: parseFloat(row['Price']) || 0,
                quantity: parseInt(row['Quantity']) || 0,
                quantityPerCarton: row['Quantity Per Carton'] ? parseInt(row['Quantity Per Carton']) : null,
                cbm: row['CBM'] ? parseFloat(row['CBM']) : null,
                minStockLevel: row['Min Stock Level'] ? parseInt(row['Min Stock Level']) : null,
                categoryId: category?.id || null,
                vendorId: vendor?.id || req.user.id,
                country: row['Country'] || '',
                city: row['City'] || '',
                status: row['Status'] || 'PENDING_APPROVAL',
                isFeatured: row['Is Featured']?.toLowerCase() === 'yes',
                acceptsNegotiation: row['Accepts Negotiation']?.toLowerCase() === 'yes',
                metaTitleAr: row['Meta Title (Arabic)'] || '',
                metaTitleEn: row['Meta Title (English)'] || '',
                metaDescriptionAr: row['Meta Description (Arabic)'] || '',
                metaDescriptionEn: row['Meta Description (English)'] || '',
                metaKeywords: row['Meta Keywords'] || '',
                slug: row['Slug'] || '',
                canonicalUrl: row['Canonical URL'] || '',
                ogTitleAr: row['OG Title (Arabic)'] || '',
                ogTitleEn: row['OG Title (English)'] || '',
                ogDescriptionAr: row['OG Description (Arabic)'] || '',
                ogDescriptionEn: row['OG Description (English)'] || '',
                ogImage: row['OG Image URL'] || '',
                twitterCardTitleAr: row['Twitter Title (Arabic)'] || '',
                twitterCardTitleEn: row['Twitter Title (English)'] || '',
                twitterCardDescriptionAr: row['Twitter Description (Arabic)'] || '',
                twitterCardDescriptionEn: row['Twitter Description (English)'] || '',
                twitterCardImage: row['Twitter Image URL'] || '',
                structuredData: row['Structured Data'] || ''
              };

              let product;
              if (existingProduct) {
                // Update existing product
                product = await prisma.product.update({
                  where: { id: existingProduct.id },
                  data: productData
                });
                results.push({ row: rowNumber, sku: row['SKU'], action: 'updated', product });
              } else {
                // Create new product
                product = await prisma.product.create({
                  data: productData
                });
                results.push({ row: rowNumber, sku: row['SKU'], action: 'created', product });
              }

              // Handle images
              if (row['All Image URLs']) {
                const imageUrls = row['All Image URLs'].split(';').filter(url => url.trim());
                const primaryUrl = row['Primary Image URL'] || imageUrls[0];

                // Delete existing images for this product (optional - comment out if you want to keep existing)
                // await prisma.productImage.deleteMany({ where: { productId: product.id } });

                for (let i = 0; i < imageUrls.length && i < 10; i++) {
                  const imageUrl = imageUrls[i].trim();
                  if (imageUrl) {
                    // Check if image already exists
                    const existingImage = await prisma.productImage.findFirst({
                      where: {
                        productId: product.id,
                        imageUrl: imageUrl
                      }
                    });

                    if (existingImage) {
                      // Update existing image
                      await prisma.productImage.update({
                        where: { id: existingImage.id },
                        data: {
                          imageOrder: i + 1,
                          isPrimary: imageUrl === primaryUrl
                        }
                      });
                    } else {
                      // Create new image
                      await prisma.productImage.create({
                        data: {
                          productId: product.id,
                          imageUrl: imageUrl,
                          imageOrder: i + 1,
                          isPrimary: imageUrl === primaryUrl,
                          altText: product.nameEn || product.nameAr || ''
                        }
                      });
                    }
                  }
                }

                // Ensure only one primary image
                if (primaryUrl) {
                  await prisma.productImage.updateMany({
                    where: {
                      productId: product.id,
                      imageUrl: { not: primaryUrl }
                    },
                    data: { isPrimary: false }
                  });
                }
              }

              // Create translation keys
              if (productData.nameAr || productData.nameEn) {
                await createOrUpdateTranslationKey(
                  `product.name.${product.id}`,
                  { ar: productData.nameAr, en: productData.nameEn },
                  'Product',
                  product.id
                );
              }

            } catch (error) {
              errors.push({
                row: rowNumber,
                sku: row['SKU'] || 'N/A',
                error: error.message
              });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          successResponse(res, {
            total: rows.length,
            success: results.length,
            failed: errors.length,
            results: results.slice(0, 10), // Return first 10 results
            errors: errors.slice(0, 10) // Return first 10 errors
          }, `Import completed: ${results.length} succeeded, ${errors.length} failed`, 200);

          resolve();
        } catch (error) {
          fs.unlinkSync(filePath);
          reject(error);
        }
      })
      .on('error', (error) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(error);
      });
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getProductsBySeller,
  uploadProductImages,
  deleteProductImage,
  approveProduct,
  rejectProduct,
  exportProducts,
  downloadTemplate,
  importProducts
};


