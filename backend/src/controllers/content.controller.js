const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get terms and conditions
// @route   GET /api/content/terms
// @access  Public
const getTerms = asyncHandler(async (req, res) => {
  const content = await prisma.contentPage.findFirst({
    where: {
      type: 'TERMS',
      isActive: true
    }
  });

  if (!content) {
    return errorResponse(res, 'Terms and conditions not found', 404);
  }

  successResponse(res, content, 'Terms and conditions retrieved successfully');
});

// @desc    Get privacy policy
// @route   GET /api/content/privacy
// @access  Public
const getPrivacy = asyncHandler(async (req, res) => {
  const content = await prisma.contentPage.findFirst({
    where: {
      type: 'PRIVACY',
      isActive: true
    }
  });

  if (!content) {
    return errorResponse(res, 'Privacy policy not found', 404);
  }

  successResponse(res, content, 'Privacy policy retrieved successfully');
});

// @desc    Get delivery information
// @route   GET /api/content/delivery-info
// @access  Public
const getDeliveryInfo = asyncHandler(async (req, res) => {
  const content = await prisma.contentPage.findFirst({
    where: {
      type: 'DELIVERY_INFO',
      isActive: true
    }
  });

  if (!content) {
    return errorResponse(res, 'Delivery information not found', 404);
  }

  successResponse(res, content, 'Delivery information retrieved successfully');
});

// @desc    Update content
// @route   PUT /api/content/:type
// @access  Private (Admin)
const updateContent = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { titleKey, contentKey, isActive } = req.body;

  if (!['TERMS', 'PRIVACY', 'DELIVERY_INFO', 'ABOUT_US', 'CONTACT'].includes(type)) {
    return errorResponse(res, 'Invalid content type', 400);
  }

  let content = await prisma.contentPage.findFirst({
    where: { type }
  });

  const data = {
    type,
    titleKey: titleKey || null,
    contentKey: contentKey || null,
    isActive: isActive !== undefined ? isActive : true,
    updatedBy: req.user.id
  };

  if (content) {
    content = await prisma.contentPage.update({
      where: { id: content.id },
      data
    });
  } else {
    content = await prisma.contentPage.create({
      data: {
        ...data,
        createdBy: req.user.id
      }
    });
  }

  successResponse(res, content, 'Content updated successfully');
});

// @desc    Get content page SEO data
// @route   GET /api/content/:type/seo
// @access  Public
const getContentSEO = asyncHandler(async (req, res) => {
  const { type } = req.params;

  const content = await prisma.contentPage.findFirst({
    where: { type }
  });

  if (!content) {
    return errorResponse(res, 'Content not found', 404);
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
// @route   PUT /api/content/:type/seo
// @access  Private (Admin)
const updateContentSEO = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const seoData = req.body;

  let content = await prisma.contentPage.findFirst({
    where: { type }
  });

  if (!content) {
    return errorResponse(res, 'Content not found', 404);
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

module.exports = {
  getTerms,
  getPrivacy,
  getDeliveryInfo,
  updateContent,
  getContentSEO,
  updateContentSEO
};



