const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get stock level reports
// @route   GET /api/analytics/stock-levels
// @access  Private (Vendor/Admin)
const getStockLevels = asyncHandler(async (req, res) => {
  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  const [totalProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({
      where: {
        ...where,
        minStockLevel: { not: null },
        quantity: { lte: prisma.raw('minStockLevel') }
      }
    }),
    prisma.product.count({
      where: {
        ...where,
        status: 'SOLD_OUT'
      }
    })
  ]);

  successResponse(res, {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    inStockProducts: totalProducts - outOfStockProducts
  }, 'Stock level reports retrieved successfully');
});

// @desc    Get sales data
// @route   GET /api/analytics/sales
// @access  Private (Vendor/Admin)
const getSalesData = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = { status: 'COMPLETED' };

  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  if (startDate) where.orderDate = { gte: new Date(startDate) };
  if (endDate) {
    where.orderDate = {
      ...where.orderDate,
      lte: new Date(endDate)
    };
  }

  const [totalOrders, totalRevenue, averageOrderValue] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where,
      _avg: { totalAmount: true }
    })
  ]);

  successResponse(res, {
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    averageOrderValue: averageOrderValue._avg.totalAmount || 0
  }, 'Sales data retrieved successfully');
});

// @desc    Get order statistics
// @route   GET /api/analytics/orders
// @access  Private (Vendor/Admin)
const getOrderStatistics = asyncHandler(async (req, res) => {
  const where = {};
  if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  const [totalOrders, byStatus] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ]);

  const statusBreakdown = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  successResponse(res, {
    totalOrders,
    statusBreakdown
  }, 'Order statistics retrieved successfully');
});

// @desc    Get search analytics
// @route   GET /api/analytics/search
// @access  Private (Admin)
const getSearchAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = {};

  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(endDate)
    };
  }

  const [totalSearches, searchesWithResults, searchesWithoutResults, popularSearches] = await Promise.all([
    prisma.searchHistory.count({ where }),
    prisma.searchHistory.count({
      where: {
        ...where,
        resultCount: { gt: 0 }
      }
    }),
    prisma.searchHistory.count({
      where: {
        ...where,
        OR: [
          { resultCount: 0 },
          { resultCount: null }
        ]
      }
    }),
    prisma.searchHistory.groupBy({
      by: ['searchQuery'],
      where: {
        ...where,
        searchQuery: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          searchQuery: 'desc'
        }
      },
      take: 10
    })
  ]);

  successResponse(res, {
    totalSearches,
    searchesWithResults,
    searchesWithoutResults,
    popularSearches: popularSearches.map(item => ({
      query: item.searchQuery,
      count: item._count
    }))
  }, 'Search analytics retrieved successfully');
});

// @desc    Get performance metrics (admin)
// @route   GET /api/analytics/performance
// @access  Private (Admin)
const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const [totalUsers, totalVendors, totalProducts, totalOrders, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count({ where: { status: 'APPROVED' } }),
    prisma.product.count({ where: { status: 'AVAILABLE' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true }
    })
  ]);

  successResponse(res, {
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0
  }, 'Performance metrics retrieved successfully');
});

// @desc    Get popular products
// @route   GET /api/analytics/products/popular
// @access  Public
const getPopularProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await prisma.product.findMany({
    where: {
      status: 'AVAILABLE'
    },
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
      },
      category: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true
        }
      }
    },
    orderBy: [
      { rating: 'desc' },
      { reviewCount: 'desc' }
    ]
  });

  successResponse(res, products, 'Popular products retrieved successfully');
});

module.exports = {
  getStockLevels,
  getSalesData,
  getOrderStatistics,
  getSearchAnalytics,
  getPerformanceMetrics,
  getPopularProducts
};



