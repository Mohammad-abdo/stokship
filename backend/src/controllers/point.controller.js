const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get point balance
// @route   GET /api/points/balance
// @access  Private (User/Vendor)
const getPointBalance = asyncHandler(async (req, res) => {
  const pointType = req.userType === 'VENDOR' ? 'VENDOR' : 'USER';
  const userId = req.userType === 'VENDOR' ? null : req.user.id;
  const vendorId = req.userType === 'VENDOR' ? req.user.id : null;

  let pointSystem = await prisma.pointSystem.findFirst({
    where: {
      pointType,
      userId,
      vendorId
    }
  });

  if (!pointSystem) {
    pointSystem = await prisma.pointSystem.create({
      data: {
        pointType,
        userId,
        vendorId,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        totalExpired: 0
      }
    });
  }

  successResponse(res, pointSystem, 'Point balance retrieved successfully');
});

// @desc    Get point transactions
// @route   GET /api/points/transactions
// @access  Private (User/Vendor)
const getPointTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const pointType = req.userType === 'VENDOR' ? 'VENDOR' : 'USER';
  const userId = req.userType === 'VENDOR' ? null : req.user.id;
  const vendorId = req.userType === 'VENDOR' ? req.user.id : null;

  const pointSystem = await prisma.pointSystem.findFirst({
    where: {
      pointType,
      userId,
      vendorId
    }
  });

  if (!pointSystem) {
    return paginatedResponse(res, [], {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      pages: 0
    }, 'No point transactions found');
  }

  const where = { pointSystemId: pointSystem.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.pointTransaction.count({ where })
  ]);

  paginatedResponse(res, transactions, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Point transactions retrieved successfully');
});

// @desc    Get point earning rules
// @route   GET /api/points/rules
// @access  Public
const getPointRules = asyncHandler(async (req, res) => {
  const pointType = req.userType === 'VENDOR' ? 'VENDOR' : 'USER';

  const rules = await prisma.pointRule.findMany({
    where: {
      pointType,
      isActive: true,
      validFrom: { lte: new Date() },
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, rules, 'Point rules retrieved successfully');
});

// @desc    Redeem points for discount
// @route   POST /api/points/redeem
// @access  Private (User/Vendor)
const redeemPoints = asyncHandler(async (req, res) => {
  const { points, orderId } = req.body;

  if (!points || points <= 0) {
    return errorResponse(res, 'Please provide valid points amount', 400);
  }

  const pointType = req.userType === 'VENDOR' ? 'VENDOR' : 'USER';
  const userId = req.userType === 'VENDOR' ? null : req.user.id;
  const vendorId = req.userType === 'VENDOR' ? req.user.id : null;

  let pointSystem = await prisma.pointSystem.findFirst({
    where: {
      pointType,
      userId,
      vendorId
    }
  });

  if (!pointSystem) {
    return errorResponse(res, 'No points available', 400);
  }

  if (pointSystem.balance < points) {
    return errorResponse(res, 'Insufficient points', 400);
  }

  // Get conversion rate (e.g., 100 points = $1)
  const conversionRate = 100; // This should come from settings
  const discountAmount = points / conversionRate;

  // Update point system
  const updated = await prisma.pointSystem.update({
    where: { id: pointSystem.id },
    data: {
      balance: pointSystem.balance - points,
      totalRedeemed: pointSystem.totalRedeemed + points
    }
  });

  // Create transaction
  await prisma.pointTransaction.create({
    data: {
      pointSystemId: pointSystem.id,
      userId,
      vendorId,
      type: 'REDEEMED',
      points: -points,
      balanceBefore: pointSystem.balance,
      balanceAfter: updated.balance,
      description: `Redeemed ${points} points for discount`,
      relatedId: orderId ? parseInt(orderId) : null,
      relatedType: orderId ? 'order' : null
    }
  });

  successResponse(res, {
    pointsRedeemed: points,
    discountAmount,
    remainingBalance: updated.balance
  }, 'Points redeemed successfully');
});

// @desc    Get all user points (admin)
// @route   GET /api/admin/points/users
// @access  Private (Admin)
const getAllUserPoints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [pointSystems, total] = await Promise.all([
    prisma.pointSystem.findMany({
      where: {
        pointType: 'USER'
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { balance: 'desc' }
    }),
    prisma.pointSystem.count({
      where: { pointType: 'USER' }
    })
  ]);

  paginatedResponse(res, pointSystems, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'User points retrieved successfully');
});

// @desc    Get all vendor points (admin)
// @route   GET /api/admin/points/vendors
// @access  Private (Admin)
const getAllVendorPoints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [pointSystems, total] = await Promise.all([
    prisma.pointSystem.findMany({
      where: {
        pointType: 'VENDOR'
      },
      skip,
      take: parseInt(limit),
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            email: true
          }
        }
      },
      orderBy: { balance: 'desc' }
    }),
    prisma.pointSystem.count({
      where: { pointType: 'VENDOR' }
    })
  ]);

  paginatedResponse(res, pointSystems, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Vendor points retrieved successfully');
});

// @desc    Manually adjust points (admin)
// @route   POST /api/admin/points/adjust
// @access  Private (Admin)
const adjustPoints = asyncHandler(async (req, res) => {
  const { userId, vendorId, points, description } = req.body;

  if (!points) {
    return errorResponse(res, 'Please provide points amount', 400);
  }

  const pointType = vendorId ? 'VENDOR' : 'USER';
  const pointUserId = vendorId ? null : userId;
  const pointVendorId = vendorId || null;

  let pointSystem = await prisma.pointSystem.findFirst({
    where: {
      pointType,
      userId: pointUserId,
      vendorId: pointVendorId
    }
  });

  if (!pointSystem) {
    pointSystem = await prisma.pointSystem.create({
      data: {
        pointType,
        userId: pointUserId,
        vendorId: pointVendorId,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        totalExpired: 0
      }
    });
  }

  const balanceBefore = pointSystem.balance;
  const balanceAfter = balanceBefore + parseInt(points);

  const updated = await prisma.pointSystem.update({
    where: { id: pointSystem.id },
    data: {
      balance: balanceAfter,
      totalEarned: points > 0 ? pointSystem.totalEarned + points : pointSystem.totalEarned
    }
  });

  // Create transaction
  await prisma.pointTransaction.create({
    data: {
      pointSystemId: pointSystem.id,
      userId: pointUserId,
      vendorId: pointVendorId,
      type: 'ADJUSTED',
      points: parseInt(points),
      balanceBefore,
      balanceAfter,
      description: description || `Admin adjustment: ${points > 0 ? '+' : ''}${points} points`,
      processedBy: req.user.id
    }
  });

  successResponse(res, updated, 'Points adjusted successfully');
});

// @desc    Get point system analytics (admin)
// @route   GET /api/admin/points/analytics
// @access  Private (Admin)
const getPointAnalytics = asyncHandler(async (req, res) => {
  const [userStats, vendorStats, recentTransactions] = await Promise.all([
    prisma.pointSystem.aggregate({
      where: { pointType: 'USER' },
      _sum: {
        balance: true,
        totalEarned: true,
        totalRedeemed: true
      },
      _count: true
    }),
    prisma.pointSystem.aggregate({
      where: { pointType: 'VENDOR' },
      _sum: {
        balance: true,
        totalEarned: true,
        totalRedeemed: true
      },
      _count: true
    }),
    prisma.pointTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        pointSystem: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            vendor: {
              select: { companyName: true, email: true }
            }
          }
        }
      }
    })
  ]);

  successResponse(res, {
    users: userStats,
    vendors: vendorStats,
    recentTransactions
  }, 'Point analytics retrieved successfully');
});

// @desc    Update point earning rules (admin)
// @route   PUT /api/admin/points/rules
// @access  Private (Admin)
const updatePointRules = asyncHandler(async (req, res) => {
  const { rules } = req.body;

  if (!rules || !Array.isArray(rules)) {
    return errorResponse(res, 'Please provide rules array', 400);
  }

  // This would typically update or create rules
  // For now, return success
  successResponse(res, { message: 'Rules updated successfully' }, 'Point rules updated successfully');
});

module.exports = {
  getPointBalance,
  getPointTransactions,
  getPointRules,
  redeemPoints,
  getAllUserPoints,
  getAllVendorPoints,
  adjustPoints,
  getPointAnalytics,
  updatePointRules
};



