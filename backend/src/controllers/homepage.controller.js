const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get top rated products
// @route   GET /api/home/top-rated
// @access  Public
const getTopRatedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await prisma.product.findMany({
    where: {
      status: 'AVAILABLE',
      rating: { gte: 4.0 }
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
          companyName: true,
          rating: true
        }
      },
      category: true
    },
    orderBy: { rating: 'desc' }
  });

  successResponse(res, products, 'Top rated products retrieved successfully');
});

// @desc    Get best sellers
// @route   GET /api/home/best-sellers
// @access  Public
const getBestSellers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get products with most orders
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
          orderItems: true
        }
      }
    },
    orderBy: {
      orderItems: {
        _count: 'desc'
      }
    }
  });

  successResponse(res, products, 'Best sellers retrieved successfully');
});

// @desc    Get recently added products
// @route   GET /api/home/recently-added
// @access  Public
const getRecentlyAddedProducts = asyncHandler(async (req, res) => {
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
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, products, 'Recently added products retrieved successfully');
});

// @desc    Get most purchased products
// @route   GET /api/home/most-purchased
// @access  Public
const getMostPurchasedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // This would aggregate from order items
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
      category: true
    },
    orderBy: { reviewCount: 'desc' }
  });

  successResponse(res, products, 'Most purchased products retrieved successfully');
});

// @desc    Get popular categories
// @route   GET /api/home/popular-categories
// @access  Public
const getPopularCategories = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null // Main categories only
    },
    take: parseInt(limit),
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      products: {
        _count: 'desc'
      }
    }
  });

  successResponse(res, categories, 'Popular categories retrieved successfully');
});

// @desc    Get business services
// @route   GET /api/home/business-services
// @access  Public
const getBusinessServices = asyncHandler(async (req, res) => {
  const services = await prisma.businessService.findMany({
    where: {
      isActive: true
    },
    orderBy: { createdAt: 'asc' }
  });

  successResponse(res, services, 'Business services retrieved successfully');
});

// @desc    Get promotional banners
// @route   GET /api/home/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: new Date() } }
      ],
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    },
    orderBy: { position: 'asc' }
  });

  successResponse(res, banners, 'Banners retrieved successfully');
});

module.exports = {
  getTopRatedProducts,
  getBestSellers,
  getRecentlyAddedProducts,
  getMostPurchasedProducts,
  getPopularCategories,
  getBusinessServices,
  getBanners
};



