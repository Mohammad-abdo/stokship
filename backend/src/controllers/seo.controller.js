const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get global SEO settings
// @route   GET /api/seo/settings
// @access  Public
const getGlobalSEOSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.globalSEO.findFirst();

  if (!settings) {
    // Return default settings
    return successResponse(res, {
      siteTitle: '',
      siteDescription: '',
      siteKeywords: '',
      ogImage: '',
      twitterCardImage: '',
      robotsTxt: '',
      sitemapUrl: ''
    }, 'Global SEO settings retrieved successfully');
  }

  successResponse(res, settings, 'Global SEO settings retrieved successfully');
});

// @desc    Update global SEO settings
// @route   PUT /api/seo/settings
// @access  Private (Admin)
const updateGlobalSEOSettings = asyncHandler(async (req, res) => {
  const updateData = req.body;

  let settings = await prisma.globalSEO.findFirst();

  const data = {};
  if (updateData.siteTitle) data.siteTitle = updateData.siteTitle;
  if (updateData.siteDescription) data.siteDescription = updateData.siteDescription;
  if (updateData.siteKeywords) data.siteKeywords = updateData.siteKeywords;
  if (updateData.ogImage) data.ogImage = updateData.ogImage;
  if (updateData.twitterCardImage) data.twitterCardImage = updateData.twitterCardImage;
  if (updateData.robotsTxt) data.robotsTxt = updateData.robotsTxt;
  if (updateData.sitemapUrl) data.sitemapUrl = updateData.sitemapUrl;
  data.updatedBy = req.user.id;

  if (settings) {
    settings = await prisma.globalSEO.update({
      where: { id: settings.id },
      data
    });
  } else {
    settings = await prisma.globalSEO.create({
      data
    });
  }

  successResponse(res, settings, 'Global SEO settings updated successfully');
});

// @desc    Get product SEO data
// @route   GET /api/seo/products/:id
// @access  Public
const getProductSEO = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      metaTitleKey: true,
      metaDescriptionKey: true,
      metaKeywords: true,
      slug: true,
      canonicalUrl: true,
      ogTitleKey: true,
      ogDescriptionKey: true,
      ogImage: true,
      twitterCardTitleKey: true,
      twitterCardDescriptionKey: true,
      twitterCardImage: true,
      structuredData: true
    }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  successResponse(res, product, 'Product SEO data retrieved successfully');
});

// @desc    Update product SEO data
// @route   PUT /api/seo/products/:id
// @access  Private (Vendor/Admin)
const updateProductSEO = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const seoData = req.body;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check authorization
  if (req.userType === 'VENDOR' && product.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to update this product', 403);
  }

  const data = {};
  if (seoData.metaTitleKey) data.metaTitleKey = seoData.metaTitleKey;
  if (seoData.metaDescriptionKey) data.metaDescriptionKey = seoData.metaDescriptionKey;
  if (seoData.metaKeywords) data.metaKeywords = seoData.metaKeywords;
  if (seoData.slug) data.slug = seoData.slug;
  if (seoData.canonicalUrl) data.canonicalUrl = seoData.canonicalUrl;
  if (seoData.ogTitleKey) data.ogTitleKey = seoData.ogTitleKey;
  if (seoData.ogDescriptionKey) data.ogDescriptionKey = seoData.ogDescriptionKey;
  if (seoData.ogImage) data.ogImage = seoData.ogImage;
  if (seoData.twitterCardTitleKey) data.twitterCardTitleKey = seoData.twitterCardTitleKey;
  if (seoData.twitterCardDescriptionKey) data.twitterCardDescriptionKey = seoData.twitterCardDescriptionKey;
  if (seoData.twitterCardImage) data.twitterCardImage = seoData.twitterCardImage;
  if (seoData.structuredData) data.structuredData = seoData.structuredData;

  const updated = await prisma.product.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Product SEO updated successfully');
});

// @desc    Get category SEO data
// @route   GET /api/seo/categories/:id
// @access  Public
const getCategorySEO = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      metaTitleKey: true,
      metaDescriptionKey: true,
      metaKeywords: true,
      slug: true,
      canonicalUrl: true,
      ogTitleKey: true,
      ogDescriptionKey: true,
      ogImage: true,
      twitterCardTitleKey: true,
      twitterCardDescriptionKey: true,
      twitterCardImage: true,
      structuredData: true
    }
  });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  successResponse(res, category, 'Category SEO data retrieved successfully');
});

// @desc    Update category SEO data
// @route   PUT /api/seo/categories/:id
// @access  Private (Admin)
const updateCategorySEO = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const seoData = req.body;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) }
  });

  if (!category) {
    return errorResponse(res, 'Category not found', 404);
  }

  const data = {};
  if (seoData.metaTitleKey) data.metaTitleKey = seoData.metaTitleKey;
  if (seoData.metaDescriptionKey) data.metaDescriptionKey = seoData.metaDescriptionKey;
  if (seoData.metaKeywords) data.metaKeywords = seoData.metaKeywords;
  if (seoData.slug) data.slug = seoData.slug;
  if (seoData.canonicalUrl) data.canonicalUrl = seoData.canonicalUrl;
  if (seoData.ogTitleKey) data.ogTitleKey = seoData.ogTitleKey;
  if (seoData.ogDescriptionKey) data.ogDescriptionKey = seoData.ogDescriptionKey;
  if (seoData.ogImage) data.ogImage = seoData.ogImage;
  if (seoData.twitterCardTitleKey) data.twitterCardTitleKey = seoData.twitterCardTitleKey;
  if (seoData.twitterCardDescriptionKey) data.twitterCardDescriptionKey = seoData.twitterCardDescriptionKey;
  if (seoData.twitterCardImage) data.twitterCardImage = seoData.twitterCardImage;
  if (seoData.structuredData) data.structuredData = seoData.structuredData;

  const updated = await prisma.category.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Category SEO updated successfully');
});

// @desc    Get content page SEO data
// @route   GET /api/seo/content/:type
// @access  Public
const getContentSEO = asyncHandler(async (req, res) => {
  const { type } = req.params;

  const content = await prisma.contentPage.findFirst({
    where: { type }
  });

  if (!content) {
    return errorResponse(res, 'Content page not found', 404);
  }

  const seo = {
    metaTitleKey: content.metaTitleKey,
    metaDescriptionKey: content.metaDescriptionKey,
    metaKeywords: content.metaKeywords,
    slug: content.slug,
    canonicalUrl: content.canonicalUrl,
    ogTitleKey: content.ogTitleKey,
    ogDescriptionKey: content.ogDescriptionKey,
    ogImage: content.ogImage,
    twitterCardTitleKey: content.twitterCardTitleKey,
    twitterCardDescriptionKey: content.twitterCardDescriptionKey,
    twitterCardImage: content.twitterCardImage,
    structuredData: content.structuredData
  };

  successResponse(res, seo, 'Content SEO data retrieved successfully');
});

// @desc    Update content page SEO data
// @route   PUT /api/seo/content/:type
// @access  Private (Admin)
const updateContentSEO = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const seoData = req.body;

  const content = await prisma.contentPage.findFirst({
    where: { type }
  });

  if (!content) {
    return errorResponse(res, 'Content page not found', 404);
  }

  const data = {};
  if (seoData.metaTitleKey) data.metaTitleKey = seoData.metaTitleKey;
  if (seoData.metaDescriptionKey) data.metaDescriptionKey = seoData.metaDescriptionKey;
  if (seoData.metaKeywords) data.metaKeywords = seoData.metaKeywords;
  if (seoData.slug) data.slug = seoData.slug;
  if (seoData.canonicalUrl) data.canonicalUrl = seoData.canonicalUrl;
  if (seoData.ogTitleKey) data.ogTitleKey = seoData.ogTitleKey;
  if (seoData.ogDescriptionKey) data.ogDescriptionKey = seoData.ogDescriptionKey;
  if (seoData.ogImage) data.ogImage = seoData.ogImage;
  if (seoData.twitterCardTitleKey) data.twitterCardTitleKey = seoData.twitterCardTitleKey;
  if (seoData.twitterCardDescriptionKey) data.twitterCardDescriptionKey = seoData.twitterCardDescriptionKey;
  if (seoData.twitterCardImage) data.twitterCardImage = seoData.twitterCardImage;
  if (seoData.structuredData) data.structuredData = seoData.structuredData;
  data.updatedBy = req.user.id;

  const updated = await prisma.contentPage.update({
    where: { id: content.id },
    data
  });

  successResponse(res, updated, 'Content SEO updated successfully');
});

// @desc    Generate SEO-friendly slug
// @route   POST /api/seo/generate-slug
// @access  Private
const generateSlug = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return errorResponse(res, 'Please provide text', 400);
  }

  // Generate slug from text
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  successResponse(res, { slug }, 'Slug generated successfully');
});

// @desc    Validate slug uniqueness
// @route   GET /api/seo/validate-slug
// @access  Public
const validateSlug = asyncHandler(async (req, res) => {
  const { slug, type, id } = req.query;

  if (!slug || !type) {
    return errorResponse(res, 'Please provide slug and type', 400);
  }

  let exists = false;

  if (type === 'product') {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        id: id ? { not: parseInt(id) } : undefined
      }
    });
    exists = !!product;
  } else if (type === 'category') {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        id: id ? { not: parseInt(id) } : undefined
      }
    });
    exists = !!category;
  } else if (type === 'content') {
    const content = await prisma.contentPage.findFirst({
      where: {
        slug,
        id: id ? { not: parseInt(id) } : undefined
      }
    });
    exists = !!content;
  }

  successResponse(res, {
    slug,
    available: !exists,
    exists
  }, 'Slug validation completed');
});

// @desc    Get XML sitemap
// @route   GET /api/seo/sitemap
// @access  Public
const getSitemap = asyncHandler(async (req, res) => {
  // Generate XML sitemap
  const products = await prisma.product.findMany({
    where: { status: 'AVAILABLE' },
    select: { slug: true, updatedAt: true }
  });

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true }
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add products
  products.forEach(product => {
    xml += `  <url>\n`;
    xml += `    <loc>https://stockship.com/products/${product.slug || product.id}</loc>\n`;
    xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  // Add categories
  categories.forEach(category => {
    xml += `  <url>\n`;
    xml += `    <loc>https://stockship.com/categories/${category.slug || category.id}</loc>\n`;
    xml += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>';

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// @desc    Get robots.txt
// @route   GET /api/seo/robots-txt
// @access  Public
const getRobotsTxt = asyncHandler(async (req, res) => {
  const settings = await prisma.globalSEO.findFirst();

  const robotsTxt = settings?.robotsTxt || `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://stockship.com/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// @desc    Update robots.txt
// @route   PUT /api/seo/robots-txt
// @access  Private (Admin)
const updateRobotsTxt = asyncHandler(async (req, res) => {
  const { robotsTxt } = req.body;

  if (!robotsTxt) {
    return errorResponse(res, 'Please provide robots.txt content', 400);
  }

  let settings = await prisma.globalSEO.findFirst();

  if (settings) {
    settings = await prisma.globalSEO.update({
      where: { id: settings.id },
      data: {
        robotsTxt,
        updatedBy: req.user.id
      }
    });
  } else {
    settings = await prisma.globalSEO.create({
      data: {
        robotsTxt,
        updatedBy: req.user.id
      }
    });
  }

  successResponse(res, settings, 'Robots.txt updated successfully');
});

// @desc    Get structured data (JSON-LD)
// @route   GET /api/seo/structured-data/:type/:id
// @access  Public
const getStructuredData = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  let structuredData = null;

  if (type === 'product') {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendor: {
          select: {
            companyName: true
          }
        },
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        }
      }
    });

    if (product && product.structuredData) {
      structuredData = JSON.parse(product.structuredData);
    } else if (product) {
      // Generate default structured data
      structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.nameKey,
        description: product.descriptionKey,
        sku: product.sku,
        offers: {
          '@type': 'Offer',
          price: product.price.toString(),
          priceCurrency: 'SAR',
          availability: product.status === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
      };
    }
  }

  if (!structuredData) {
    return errorResponse(res, 'Structured data not found', 404);
  }

  successResponse(res, structuredData, 'Structured data retrieved successfully');
});

// @desc    Get SEO analytics (admin)
// @route   GET /api/seo/analytics
// @access  Private (Admin)
const getSEOAnalytics = asyncHandler(async (req, res) => {
  const [productsWithoutSEO, categoriesWithoutSEO, totalProducts, totalCategories] = await Promise.all([
    prisma.product.count({
      where: {
        OR: [
          { metaTitleKey: null },
          { metaDescriptionKey: null },
          { slug: null }
        ]
      }
    }),
    prisma.category.count({
      where: {
        OR: [
          { metaTitleKey: null },
          { metaDescriptionKey: null },
          { slug: null }
        ]
      }
    }),
    prisma.product.count(),
    prisma.category.count()
  ]);

  successResponse(res, {
    productsWithoutSEO,
    categoriesWithoutSEO,
    totalProducts,
    totalCategories,
    productsWithSEO: totalProducts - productsWithoutSEO,
    categoriesWithSEO: totalCategories - categoriesWithoutSEO
  }, 'SEO analytics retrieved successfully');
});

// @desc    Check SEO completeness
// @route   GET /api/seo/check
// @access  Private (Admin)
const checkSEOCompleteness = asyncHandler(async (req, res) => {
  const { type, id } = req.query;

  if (!type || !id) {
    return errorResponse(res, 'Please provide type and id', 400);
  }

  let entity = null;
  let missingFields = [];

  if (type === 'product') {
    entity = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!entity.metaTitleKey) missingFields.push('metaTitleKey');
    if (!entity.metaDescriptionKey) missingFields.push('metaDescriptionKey');
    if (!entity.slug) missingFields.push('slug');
    if (!entity.metaKeywords) missingFields.push('metaKeywords');
  } else if (type === 'category') {
    entity = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!entity.metaTitleKey) missingFields.push('metaTitleKey');
    if (!entity.metaDescriptionKey) missingFields.push('metaDescriptionKey');
    if (!entity.slug) missingFields.push('slug');
  }

  if (!entity) {
    return errorResponse(res, 'Entity not found', 404);
  }

  const seoScore = ((10 - missingFields.length) / 10) * 100;

  // Update or create SEO analytics
  await prisma.sEOAnalytics.upsert({
    where: {
      entityType_entityId: {
        entityType: type.toUpperCase(),
        entityId: parseInt(id)
      }
    },
    update: {
      seoScore: Math.round(seoScore),
      missingFields: JSON.stringify(missingFields),
      lastChecked: new Date()
    },
    create: {
      entityType: type.toUpperCase(),
      entityId: parseInt(id),
      seoScore: Math.round(seoScore),
      missingFields: JSON.stringify(missingFields),
      lastChecked: new Date()
    }
  });

  successResponse(res, {
    entityType: type,
    entityId: parseInt(id),
    seoScore: Math.round(seoScore),
    missingFields,
    isComplete: missingFields.length === 0
  }, 'SEO completeness check completed');
});

// @desc    Bulk update SEO fields
// @route   POST /api/seo/bulk-update
// @access  Private (Admin)
const bulkUpdateSEO = asyncHandler(async (req, res) => {
  const { type, ids, seoData } = req.body;

  if (!type || !ids || !Array.isArray(ids) || !seoData) {
    return errorResponse(res, 'Please provide type, ids array, and seoData', 400);
  }

  const data = {};
  if (seoData.metaTitleKey) data.metaTitleKey = seoData.metaTitleKey;
  if (seoData.metaDescriptionKey) data.metaDescriptionKey = seoData.metaDescriptionKey;
  if (seoData.metaKeywords) data.metaKeywords = seoData.metaKeywords;

  let updated = 0;

  if (type === 'product') {
    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      },
      data
    });
    updated = result.count;
  } else if (type === 'category') {
    const result = await prisma.category.updateMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      },
      data
    });
    updated = result.count;
  }

  successResponse(res, {
    type,
    updated,
    total: ids.length
  }, 'Bulk SEO update completed successfully');
});

module.exports = {
  getGlobalSEOSettings,
  updateGlobalSEOSettings,
  getProductSEO,
  updateProductSEO,
  getCategorySEO,
  updateCategorySEO,
  getContentSEO,
  updateContentSEO,
  generateSlug,
  validateSlug,
  getSitemap,
  getRobotsTxt,
  updateRobotsTxt,
  getStructuredData,
  getSEOAnalytics,
  checkSEOCompleteness,
  bulkUpdateSEO
};



