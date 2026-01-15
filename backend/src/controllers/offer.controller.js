const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get available offers
// @route   GET /api/offers
// @access  Public
const getOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, productId, categoryId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'ACTIVE',
    isVisible: true,
    startDate: { lte: new Date() },
    endDate: { gte: new Date() }
  };

  if (productId) where.productId = parseInt(productId);
  if (categoryId) where.categoryId = parseInt(categoryId);

  const [offers, total] = await Promise.all([
    prisma.productOffer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { imageOrder: 'asc' }
            }
          }
        },
        category: true,
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productOffer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Offers retrieved successfully');
});

// @desc    Get offer details
// @route   GET /api/offers/:id
// @access  Public
const getOfferById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await prisma.productOffer.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: {
        include: {
          images: true,
          vendor: true
        }
      },
      category: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          rating: true
        }
      }
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  successResponse(res, offer, 'Offer retrieved successfully');
});

// @desc    Create product offer (vendor)
// @route   POST /api/vendor/offers
// @access  Private (Vendor)
const createOffer = asyncHandler(async (req, res) => {
  const {
    productId,
    categoryId,
    title,
    description,
    offerType,
    discountValue,
    minPurchaseAmount,
    maxDiscountAmount,
    minQuantity,
    maxQuantity,
    buyQuantity,
    getQuantity,
    startDate,
    endDate,
    usageLimit
  } = req.body;

  if (!title || !offerType || !discountValue || !startDate || !endDate) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  // Validate product belongs to vendor
  if (productId) {
    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(productId),
        vendorId: req.user.id
      }
    });

    if (!product) {
      return errorResponse(res, 'Product not found or not authorized', 404);
    }
  }

  const offer = await prisma.productOffer.create({
    data: {
      vendorId: req.user.id,
      productId: productId ? parseInt(productId) : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      title,
      description: description || null,
      offerType,
      discountValue: parseFloat(discountValue),
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      minQuantity: minQuantity ? parseInt(minQuantity) : null,
      maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
      buyQuantity: buyQuantity ? parseInt(buyQuantity) : null,
      getQuantity: getQuantity ? parseInt(getQuantity) : null,
      status: 'PENDING',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usedCount: 0,
      isVisible: true
    },
    include: {
      product: true,
      category: true
    }
  });

  successResponse(res, offer, 'Offer created successfully', 201);
});

// @desc    Get vendor's offers
// @route   GET /api/vendor/offers
// @access  Private (Vendor)
const getVendorOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { vendorId: req.user.id };
  if (status) where.status = status;

  const [offers, total] = await Promise.all([
    prisma.productOffer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { imageOrder: 'asc' }
            }
          }
        },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productOffer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Vendor offers retrieved successfully');
});

// @desc    Update offer (vendor)
// @route   PUT /api/vendor/offers/:id
// @access  Private (Vendor)
const updateOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const offer = await prisma.productOffer.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  if (offer.status === 'ACTIVE' && offer.startDate <= new Date()) {
    return errorResponse(res, 'Cannot update active offer', 400);
  }

  const data = {};
  if (updateData.title) data.title = updateData.title;
  if (updateData.description !== undefined) data.description = updateData.description;
  if (updateData.discountValue) data.discountValue = parseFloat(updateData.discountValue);
  if (updateData.startDate) data.startDate = new Date(updateData.startDate);
  if (updateData.endDate) data.endDate = new Date(updateData.endDate);
  if (updateData.usageLimit) data.usageLimit = parseInt(updateData.usageLimit);

  const updated = await prisma.productOffer.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Offer updated successfully');
});

// @desc    Delete offer (vendor)
// @route   DELETE /api/vendor/offers/:id
// @access  Private (Vendor)
const deleteOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await prisma.productOffer.findFirst({
    where: {
      id: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  await prisma.productOffer.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Offer deleted successfully');
});

// @desc    Get all offers (admin)
// @route   GET /api/admin/offers
// @access  Private (Admin)
const getAllOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;

  const [offers, total] = await Promise.all([
    prisma.productOffer.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        product: true,
        category: true,
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productOffer.count({ where })
  ]);

  paginatedResponse(res, offers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'All offers retrieved successfully');
});

// @desc    Approve offer (admin)
// @route   PUT /api/admin/offers/:id/approve
// @access  Private (Admin)
const approveOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await prisma.productOffer.findUnique({
    where: { id: parseInt(id) }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  const updated = await prisma.productOffer.update({
    where: { id: parseInt(id) },
    data: {
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy: req.user.id
    }
  });

  successResponse(res, updated, 'Offer approved successfully');
});

// @desc    Reject offer (admin)
// @route   PUT /api/admin/offers/:id/reject
// @access  Private (Admin)
const rejectOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  const offer = await prisma.productOffer.findUnique({
    where: { id: parseInt(id) }
  });

  if (!offer) {
    return errorResponse(res, 'Offer not found', 404);
  }

  const updated = await prisma.productOffer.update({
    where: { id: parseInt(id) },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
      rejectionReason: rejectionReason || null
    }
  });

  successResponse(res, updated, 'Offer rejected successfully');
});

// @desc    Create platform-wide offer (admin)
// @route   POST /api/admin/offers
// @access  Private (Admin)
const createPlatformOffer = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    offerType,
    discountValue,
    startDate,
    endDate,
    categoryId
  } = req.body;

  if (!title || !offerType || !discountValue || !startDate || !endDate) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  const offer = await prisma.productOffer.create({
    data: {
      vendorId: null, // Platform-wide offer
      categoryId: categoryId ? parseInt(categoryId) : null,
      title,
      description: description || null,
      offerType,
      discountValue: parseFloat(discountValue),
      status: 'ACTIVE',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isVisible: true,
      approvedAt: new Date(),
      approvedBy: req.user.id
    }
  });

  successResponse(res, offer, 'Platform offer created successfully', 201);
});

// @desc    Get offer analytics (admin)
// @route   GET /api/admin/offers/analytics
// @access  Private (Admin)
const getOfferAnalytics = asyncHandler(async (req, res) => {
  const [totalOffers, activeOffers, expiredOffers, totalUsage] = await Promise.all([
    prisma.productOffer.count(),
    prisma.productOffer.count({
      where: {
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    }),
    prisma.productOffer.count({
      where: {
        status: 'EXPIRED',
        OR: [
          { endDate: { lt: new Date() } }
        ]
      }
    }),
    prisma.productOffer.aggregate({
      _sum: {
        usedCount: true
      }
    })
  ]);

  successResponse(res, {
    totalOffers,
    activeOffers,
    expiredOffers,
    totalUsage: totalUsage._sum.usedCount || 0
  }, 'Offer analytics retrieved successfully');
});

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  getVendorOffers,
  updateOffer,
  deleteOffer,
  getAllOffers,
  approveOffer,
  rejectOffer,
  createPlatformOffer,
  getOfferAnalytics
};



