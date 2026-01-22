const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get all sliders
// @route   GET /api/sliders
// @access  Public
const getSliders = asyncHandler(async (req, res) => {
  const { activeOnly } = req.query;
  
  const where = activeOnly === 'true' ? { isActive: true } : {};
  
  const sliders = await prisma.slider.findMany({
    where,
    orderBy: { displayOrder: 'asc' }
  });

  successResponse(res, sliders, 'Sliders retrieved successfully');
});

// @desc    Get slider by ID
// @route   GET /api/sliders/:id
// @access  Public
const getSliderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slider = await prisma.slider.findUnique({
    where: { id }
  });

  if (!slider) {
    return errorResponse(res, 'Slider not found', 404);
  }

  successResponse(res, slider, 'Slider retrieved successfully');
});

// @desc    Create slider
// @route   POST /api/sliders
// @access  Private (Admin)
const createSlider = asyncHandler(async (req, res) => {
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    imageUrl,
    imageAlt,
    linkUrl,
    linkTextAr,
    linkTextEn,
    displayOrder,
    isActive
  } = req.body;

  if (!titleAr || !titleEn || !imageUrl) {
    return errorResponse(res, 'Title (Arabic and English) and image URL are required', 400);
  }

  const slider = await prisma.slider.create({
    data: {
      titleAr,
      titleEn,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      imageUrl,
      imageAlt: imageAlt || null,
      linkUrl: linkUrl || null,
      linkTextAr: linkTextAr || null,
      linkTextEn: linkTextEn || null,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true
    }
  });

  successResponse(res, slider, 'Slider created successfully', 201);
});

// @desc    Update slider
// @route   PUT /api/sliders/:id
// @access  Private (Admin)
const updateSlider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    imageUrl,
    imageAlt,
    linkUrl,
    linkTextAr,
    linkTextEn,
    displayOrder,
    isActive
  } = req.body;

  // Check if slider exists
  const existingSlider = await prisma.slider.findUnique({
    where: { id }
  });

  if (!existingSlider) {
    return errorResponse(res, 'Slider not found', 404);
  }

  // Prepare update data
  const data = {};
  if (titleAr !== undefined) data.titleAr = titleAr;
  if (titleEn !== undefined) data.titleEn = titleEn;
  if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
  if (descriptionEn !== undefined) data.descriptionEn = descriptionEn;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (imageAlt !== undefined) data.imageAlt = imageAlt;
  if (linkUrl !== undefined) data.linkUrl = linkUrl;
  if (linkTextAr !== undefined) data.linkTextAr = linkTextAr;
  if (linkTextEn !== undefined) data.linkTextEn = linkTextEn;
  if (displayOrder !== undefined) data.displayOrder = displayOrder;
  if (isActive !== undefined) data.isActive = isActive;

  const updatedSlider = await prisma.slider.update({
    where: { id },
    data
  });

  successResponse(res, updatedSlider, 'Slider updated successfully');
});

// @desc    Delete slider
// @route   DELETE /api/sliders/:id
// @access  Private (Admin)
const deleteSlider = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slider = await prisma.slider.findUnique({
    where: { id }
  });

  if (!slider) {
    return errorResponse(res, 'Slider not found', 404);
  }

  await prisma.slider.delete({
    where: { id }
  });

  successResponse(res, null, 'Slider deleted successfully');
});

module.exports = {
  getSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider
};

