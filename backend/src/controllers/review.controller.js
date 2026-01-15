const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, rating } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    productId: parseInt(id),
    status: 'APPROVED'
  };
  if (rating) where.rating = parseInt(rating);

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.productReview.count({ where })
  ]);

  paginatedResponse(res, reviews, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Product reviews retrieved successfully');
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private (User)
const createProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, orderId } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(res, 'Please provide a valid rating (1-5)', 400);
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { vendor: true }
  });

  if (!product) {
    return errorResponse(res, 'Product not found', 404);
  }

  // Check if user already reviewed this product
  const existingReview = await prisma.productReview.findFirst({
    where: {
      productId: parseInt(id),
      userId: req.user.id
    }
  });

  if (existingReview) {
    return errorResponse(res, 'You have already reviewed this product', 400);
  }

  // Check if order exists and belongs to user (for verified purchase)
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: req.user.id,
        status: 'COMPLETED',
        items: {
          some: {
            productId: parseInt(id)
          }
        }
      }
    });
    isVerifiedPurchase = !!order;
  }

  const review = await prisma.productReview.create({
    data: {
      productId: parseInt(id),
      userId: req.user.id,
      vendorId: product.vendorId,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      isVerifiedPurchase,
      orderId: orderId ? parseInt(orderId) : null,
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Update product rating
  const allReviews = await prisma.productReview.findMany({
    where: {
      productId: parseInt(id),
      status: 'APPROVED'
    },
    select: { rating: true }
  });

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      rating: avgRating,
      reviewCount: allReviews.length
    }
  });

  successResponse(res, review, 'Review created successfully', 201);
});

// @desc    Get supplier reviews
// @route   GET /api/suppliers/:id/reviews
// @access  Public
const getSupplierReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.vendorReview.findMany({
      where: {
        vendorId: parseInt(id),
        status: 'APPROVED'
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.vendorReview.count({
      where: {
        vendorId: parseInt(id),
        status: 'APPROVED'
      }
    })
  ]);

  paginatedResponse(res, reviews, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Supplier reviews retrieved successfully');
});

// @desc    Create supplier review
// @route   POST /api/suppliers/:id/reviews
// @access  Private (User)
const createSupplierReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(res, 'Please provide a valid rating (1-5)', 400);
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vendor) {
    return errorResponse(res, 'Supplier not found', 404);
  }

  // Check if user already reviewed this supplier
  const existingReview = await prisma.vendorReview.findFirst({
    where: {
      vendorId: parseInt(id),
      userId: req.user.id
    }
  });

  if (existingReview) {
    return errorResponse(res, 'You have already reviewed this supplier', 400);
  }

  const review = await prisma.vendorReview.create({
    data: {
      vendorId: parseInt(id),
      userId: req.user.id,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Update vendor rating
  const allReviews = await prisma.vendorReview.findMany({
    where: {
      vendorId: parseInt(id),
      status: 'APPROVED'
    },
    select: { rating: true }
  });

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  await prisma.vendor.update({
    where: { id: parseInt(id) },
    data: {
      rating: avgRating,
      reviewCount: allReviews.length
    }
  });

  successResponse(res, review, 'Review created successfully', 201);
});

// @desc    Respond to review (vendor)
// @route   POST /api/products/:id/reviews/:reviewId/respond
// @access  Private (Vendor)
const respondToReview = asyncHandler(async (req, res) => {
  const { id, reviewId } = req.params;
  const { response } = req.body;

  if (!response) {
    return errorResponse(res, 'Please provide a response', 400);
  }

  const review = await prisma.productReview.findFirst({
    where: {
      id: parseInt(reviewId),
      productId: parseInt(id),
      vendorId: req.user.id
    }
  });

  if (!review) {
    return errorResponse(res, 'Review not found', 404);
  }

  const updated = await prisma.productReview.update({
    where: { id: parseInt(reviewId) },
    data: {
      vendorResponse: response,
      vendorResponseAt: new Date()
    }
  });

  successResponse(res, updated, 'Review response submitted successfully');
});

module.exports = {
  getProductReviews,
  createProductReview,
  getSupplierReviews,
  createSupplierReview,
  respondToReview
};



