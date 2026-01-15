const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// @desc    Get available coupons
// @route   GET /api/coupons/available
// @access  Public
const getAvailableCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const coupons = await prisma.coupon.findMany({
    where: {
      status: 'ACTIVE',
      isVisible: true,
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() }
    },
    skip,
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, coupons, 'Available coupons retrieved successfully');
});

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Private (User)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;

  if (!code) {
    return errorResponse(res, 'Please provide coupon code', 400);
  }

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      status: 'ACTIVE',
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() }
    }
  });

  if (!coupon) {
    return errorResponse(res, 'Invalid or expired coupon code', 400);
  }

  // Check usage limits
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return errorResponse(res, 'Coupon usage limit reached', 400);
  }

  // Check per-user limit
  if (coupon.usageLimitPerUser) {
    const userUsage = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: req.user.id
      }
    });

    if (userUsage >= coupon.usageLimitPerUser) {
      return errorResponse(res, 'You have reached the usage limit for this coupon', 400);
    }
  }

  // Check minimum purchase amount
  if (coupon.minPurchaseAmount && amount && parseFloat(amount) < coupon.minPurchaseAmount) {
    return errorResponse(res, `Minimum purchase amount of ${coupon.minPurchaseAmount} required`, 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.couponType === 'PERCENTAGE') {
    discountAmount = (parseFloat(amount || 0) * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else if (coupon.couponType === 'FIXED_AMOUNT') {
    discountAmount = coupon.discountValue;
  } else if (coupon.couponType === 'FREE_SHIPPING') {
    discountAmount = 0; // Will be applied to shipping
  }

  successResponse(res, {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      couponType: coupon.couponType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount
    },
    discountAmount
  }, 'Coupon is valid');
});

// @desc    Get user's coupons
// @route   GET /api/coupons/my-coupons
// @access  Private (User)
const getMyCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [coupons, total] = await Promise.all([
    prisma.couponUsage.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      include: {
        coupon: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true
          }
        }
      },
      orderBy: { usedAt: 'desc' }
    }),
    prisma.couponUsage.count({ where: { userId: req.user.id } })
  ]);

  paginatedResponse(res, coupons, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'User coupons retrieved successfully');
});

// @desc    Create coupon (admin)
// @route   POST /api/admin/coupons
// @access  Private (Admin)
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    couponType,
    discountValue,
    minPurchaseAmount,
    maxDiscountAmount,
    applicableTo,
    productIds,
    categoryIds,
    vendorIds,
    userEligibility,
    userIds,
    usageLimit,
    usageLimitPerUser,
    validFrom,
    validUntil
  } = req.body;

  if (!code || !couponType || !discountValue || !validFrom || !validUntil) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existing) {
    return errorResponse(res, 'Coupon code already exists', 400);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      createdBy: req.user.id,
      couponType,
      discountValue: parseFloat(discountValue),
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      applicableTo: applicableTo || 'ALL',
      productIds: productIds ? JSON.stringify(productIds) : null,
      categoryIds: categoryIds ? JSON.stringify(categoryIds) : null,
      vendorIds: vendorIds ? JSON.stringify(vendorIds) : null,
      userEligibility: userEligibility || 'ALL_USERS',
      userIds: userIds ? JSON.stringify(userIds) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      status: 'ACTIVE',
      isVisible: true,
      approvedAt: new Date(),
      approvedBy: req.user.id
    }
  });

  successResponse(res, coupon, 'Coupon created successfully', 201);
});

// @desc    Get coupon by ID (admin)
// @route   GET /api/coupons/admin/:id
// @access  Private (Admin)
const getCouponById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id: parseInt(id) },
    include: {
      vendor: {
        select: {
          id: true,
          companyName: true,
          email: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      usages: {
        take: 10,
        orderBy: { usedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true
            }
          }
        }
      },
      _count: {
        select: {
          usages: true
        }
      }
    }
  });

  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  successResponse(res, coupon, 'Coupon retrieved successfully');
});

// @desc    Get all coupons (admin)
// @route   GET /api/admin/coupons
// @access  Private (Admin)
const getAllCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        },
        _count: {
          select: {
            usages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.coupon.count({ where })
  ]);

  paginatedResponse(res, coupons, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'All coupons retrieved successfully');
});

// @desc    Update coupon (admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private (Admin)
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const coupon = await prisma.coupon.findUnique({
    where: { id: parseInt(id) }
  });

  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  const data = {};
  if (updateData.code !== undefined) data.code = updateData.code.toUpperCase();
  if (updateData.couponType !== undefined) data.couponType = updateData.couponType;
  if (updateData.discountValue !== undefined) data.discountValue = parseFloat(updateData.discountValue);
  if (updateData.minPurchaseAmount !== undefined) data.minPurchaseAmount = updateData.minPurchaseAmount ? parseFloat(updateData.minPurchaseAmount) : null;
  if (updateData.maxDiscountAmount !== undefined) data.maxDiscountAmount = updateData.maxDiscountAmount ? parseFloat(updateData.maxDiscountAmount) : null;
  if (updateData.applicableTo !== undefined) data.applicableTo = updateData.applicableTo;
  if (updateData.userEligibility !== undefined) data.userEligibility = updateData.userEligibility;
  if (updateData.productIds !== undefined) data.productIds = updateData.productIds ? JSON.stringify(updateData.productIds) : null;
  if (updateData.categoryIds !== undefined) data.categoryIds = updateData.categoryIds ? JSON.stringify(updateData.categoryIds) : null;
  if (updateData.vendorIds !== undefined) data.vendorIds = updateData.vendorIds ? JSON.stringify(updateData.vendorIds) : null;
  if (updateData.userIds !== undefined) data.userIds = updateData.userIds ? JSON.stringify(updateData.userIds) : null;
  if (updateData.usageLimit !== undefined) data.usageLimit = updateData.usageLimit ? parseInt(updateData.usageLimit) : null;
  if (updateData.usageLimitPerUser !== undefined) data.usageLimitPerUser = updateData.usageLimitPerUser ? parseInt(updateData.usageLimitPerUser) : null;
  if (updateData.validFrom !== undefined) data.validFrom = new Date(updateData.validFrom);
  if (updateData.validUntil !== undefined) data.validUntil = new Date(updateData.validUntil);
  if (updateData.status !== undefined) data.status = updateData.status;
  if (updateData.isVisible !== undefined) data.isVisible = updateData.isVisible;

  const updated = await prisma.coupon.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Coupon updated successfully');
});

// @desc    Delete coupon (admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Private (Admin)
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id: parseInt(id) }
  });

  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  await prisma.coupon.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Coupon deleted successfully');
});

// @desc    Generate coupon codes (admin)
// @route   POST /api/admin/coupons/generate
// @access  Private (Admin)
const generateCouponCodes = asyncHandler(async (req, res) => {
  const { count = 1, prefix = 'COUPON', length = 8 } = req.body;

  const codes = [];
  for (let i = 0; i < parseInt(count); i++) {
    const randomPart = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    codes.push(`${prefix}-${randomPart}`);
  }

  successResponse(res, { codes }, 'Coupon codes generated successfully');
});

// @desc    Bulk generate coupons (admin)
// @route   POST /api/admin/coupons/bulk-generate
// @access  Private (Admin)
const bulkGenerateCoupons = asyncHandler(async (req, res) => {
  const {
    count,
    couponType,
    discountValue,
    validFrom,
    validUntil,
    prefix = 'BULK'
  } = req.body;

  if (!count || !couponType || !discountValue || !validFrom || !validUntil) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  const coupons = [];
  for (let i = 0; i < parseInt(count); i++) {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const code = `${prefix}-${randomPart}`;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        createdBy: req.user.id,
        couponType,
        discountValue: parseFloat(discountValue),
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        status: 'ACTIVE',
        isVisible: true,
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    });

    coupons.push(coupon);
  }

  successResponse(res, { coupons, count: coupons.length }, 'Coupons generated successfully', 201);
});

// @desc    Get coupon usage statistics (admin)
// @route   GET /api/admin/coupons/:id/usage
// @access  Private (Admin)
const getCouponUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id: parseInt(id) },
    include: {
      usages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true
            }
          }
        },
        orderBy: { usedAt: 'desc' }
      }
    }
  });

  if (!coupon) {
    return errorResponse(res, 'Coupon not found', 404);
  }

  const totalDiscount = coupon.usages.reduce((sum, usage) => sum + usage.discountAmount, 0);

  successResponse(res, {
    coupon,
    usageCount: coupon.usages.length,
    totalDiscount,
    remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : null
  }, 'Coupon usage statistics retrieved successfully');
});

// @desc    Create vendor coupon (vendor)
// @route   POST /api/vendor/coupons
// @access  Private (Vendor)
const createVendorCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    couponType,
    discountValue,
    minPurchaseAmount,
    maxDiscountAmount,
    usageLimit,
    usageLimitPerUser,
    validFrom,
    validUntil
  } = req.body;

  if (!code || !couponType || !discountValue || !validFrom || !validUntil) {
    return errorResponse(res, 'Please provide all required fields', 400);
  }

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existing) {
    return errorResponse(res, 'Coupon code already exists', 400);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      vendorId: req.user.id,
      createdBy: req.user.id,
      couponType,
      discountValue: parseFloat(discountValue),
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      applicableTo: 'SPECIFIC_VENDORS',
      vendorIds: JSON.stringify([req.user.id]),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      status: 'ACTIVE',
      isVisible: true
    }
  });

  successResponse(res, coupon, 'Vendor coupon created successfully', 201);
});

// @desc    Get vendor's coupons
// @route   GET /api/vendor/coupons
// @access  Private (Vendor)
const getVendorCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where: { vendorId: req.user.id },
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            usages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.coupon.count({ where: { vendorId: req.user.id } })
  ]);

  paginatedResponse(res, coupons, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Vendor coupons retrieved successfully');
});

// @desc    Get vendor coupon analytics
// @route   GET /api/vendor/coupons/analytics
// @access  Private (Vendor)
const getVendorCouponAnalytics = asyncHandler(async (req, res) => {
  const [totalCoupons, activeCoupons, totalUsage, totalDiscount] = await Promise.all([
    prisma.coupon.count({
      where: { vendorId: req.user.id }
    }),
    prisma.coupon.count({
      where: {
        vendorId: req.user.id,
        status: 'ACTIVE',
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() }
      }
    }),
    prisma.couponUsage.count({
      where: {
        coupon: {
          vendorId: req.user.id
        }
      }
    }),
    prisma.couponUsage.aggregate({
      where: {
        coupon: {
          vendorId: req.user.id
        }
      },
      _sum: {
        discountAmount: true
      }
    })
  ]);

  successResponse(res, {
    totalCoupons,
    activeCoupons,
    totalUsage,
    totalDiscount: totalDiscount._sum.discountAmount || 0
  }, 'Vendor coupon analytics retrieved successfully');
});

module.exports = {
  getAvailableCoupons,
  validateCoupon,
  getMyCoupons,
  createCoupon,
  getCouponById,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  generateCouponCodes,
  bulkGenerateCoupons,
  getCouponUsage,
  createVendorCoupon,
  getVendorCoupons,
  getVendorCouponAnalytics
};



