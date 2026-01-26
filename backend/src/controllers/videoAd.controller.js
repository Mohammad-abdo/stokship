const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get all video ads
// @route   GET /api/video-ads
// @access  Public
const getVideoAds = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  
  const where = activeOnly === 'true' ? { isActive: true } : {};
  
  const videoAds = await prisma.videoAd.findMany({
    where,
    orderBy: { displayOrder: 'asc' }
  });

  successResponse(res, videoAds, 'Video ads retrieved successfully');
});

// @desc    Get video ad by ID
// @route   GET /api/video-ads/:id
// @access  Public
const getVideoAdById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Increment view count when fetching single ad
  const videoAd = await prisma.videoAd.update({
    where: { id },
    data: {
      views: {
        increment: 1
      }
    }
  });

  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  successResponse(res, videoAd, 'Video ad retrieved successfully');
});

// @desc    Create video ad
// @route   POST /api/video-ads
// @access  Private (Admin)
const createVideoAd = asyncHandler(async (req, res) => {
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    contentAr,
    contentEn,
    videoUrl,
    thumbnailUrl,
    linkUrl,
    displayOrder,
    isActive
  } = req.body;

  if (!titleAr || !titleEn || !videoUrl) {
    return errorResponse(res, 'Title (Arabic and English) and video URL are required', 400);
  }

  const videoAd = await prisma.videoAd.create({
    data: {
      titleAr,
      titleEn,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      contentAr: contentAr || null,
      contentEn: contentEn || null,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      linkUrl: linkUrl || null,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true
    }
  });

  successResponse(res, videoAd, 'Video ad created successfully', 201);
});

// @desc    Update video ad
// @route   PUT /api/video-ads/:id
// @access  Private (Admin)
const updateVideoAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    contentAr,
    contentEn,
    videoUrl,
    thumbnailUrl,
    linkUrl,
    displayOrder,
    isActive
  } = req.body;

  // Check if video ad exists
  const existingVideoAd = await prisma.videoAd.findUnique({
    where: { id }
  });

  if (!existingVideoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  // Prepare update data
  const data = {};
  if (titleAr !== undefined) data.titleAr = titleAr;
  if (titleEn !== undefined) data.titleEn = titleEn;
  if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
  if (descriptionEn !== undefined) data.descriptionEn = descriptionEn;
  if (contentAr !== undefined) data.contentAr = contentAr;
  if (contentEn !== undefined) data.contentEn = contentEn;
  if (videoUrl !== undefined) data.videoUrl = videoUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (linkUrl !== undefined) data.linkUrl = linkUrl;
  if (displayOrder !== undefined) data.displayOrder = parseInt(displayOrder);
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

  const updatedVideoAd = await prisma.videoAd.update({
    where: { id },
    data
  });

  successResponse(res, updatedVideoAd, 'Video ad updated successfully');
});

// @desc    Delete video ad
// @route   DELETE /api/video-ads/:id
// @access  Private (Admin)
const deleteVideoAd = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const videoAd = await prisma.videoAd.findUnique({
    where: { id }
  });

  if (!videoAd) {
    return errorResponse(res, 'Video ad not found', 404);
  }

  await prisma.videoAd.delete({
    where: { id }
  });

  successResponse(res, null, 'Video ad deleted successfully');
});

module.exports = {
  getVideoAds,
  getVideoAdById,
  createVideoAd,
  updateVideoAd,
  deleteVideoAd
};
