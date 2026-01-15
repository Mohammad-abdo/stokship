const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Advanced product search
// @route   GET /api/search/products
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const {
    q,
    categoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    vendorId,
    minRating,
    country,
    city,
    status,
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'AVAILABLE'
  };

  // Text search
  if (q) {
    where.OR = [
      { nameKey: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } }
    ];
  }

  // Filters
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (minPrice) where.price = { gte: parseFloat(minPrice) };
  if (maxPrice) {
    where.price = {
      ...where.price,
      lte: parseFloat(maxPrice)
    };
  }
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (minRating) where.rating = { gte: parseFloat(minRating) };
  if (country) where.country = country;
  if (city) where.city = city;
  if (status) where.status = status;

  // Sub-category filter
  if (subCategoryId) {
    const subCategoryProducts = await prisma.productSubCategory.findMany({
      where: { categoryId: parseInt(subCategoryId) },
      select: { productId: true }
    });
    where.id = { in: subCategoryProducts.map(p => p.productId) };
  }

  const orderBy = {};
  orderBy[sort] = order;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        },
        category: true,
        vendor: {
          select: {
            id: true,
            companyName: true,
            rating: true
          }
        }
      },
      orderBy
    }),
    prisma.product.count({ where })
  ]);

  // Record search
  if (q) {
    await prisma.searchHistory.create({
      data: {
        userId: req.user?.id || null,
        searchQuery: q,
        entityType: 'PRODUCT',
        resultCount: total,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  }

  paginatedResponse(res, products, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Products retrieved successfully');
});

// @desc    Search autocomplete
// @route   GET /api/search/autocomplete
// @access  Public
const autocomplete = asyncHandler(async (req, res) => {
  const { q, type = 'product' } = req.query;

  if (!q || q.length < 2) {
    return successResponse(res, [], 'Autocomplete suggestions');
  }

  let suggestions = [];

  if (type === 'product') {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { nameKey: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } }
        ],
        status: 'AVAILABLE'
      },
      take: 10,
      select: {
        id: true,
        nameKey: true,
        sku: true
      }
    });
    suggestions = products.map(p => ({
      id: p.id,
      text: p.nameKey,
      type: 'product'
    }));
  } else if (type === 'category') {
    const categories = await prisma.category.findMany({
      where: {
        nameKey: { contains: q, mode: 'insensitive' },
        isActive: true
      },
      take: 10,
      select: {
        id: true,
        nameKey: true
      }
    });
    suggestions = categories.map(c => ({
      id: c.id,
      text: c.nameKey,
      type: 'category'
    }));
  }

  successResponse(res, suggestions, 'Autocomplete suggestions retrieved successfully');
});

// @desc    Search categories
// @route   GET /api/search/categories
// @access  Public
const searchCategories = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    isActive: true
  };

  if (q) {
    where.nameKey = { contains: q, mode: 'insensitive' };
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    }),
    prisma.category.count({ where })
  ]);

  paginatedResponse(res, categories, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Categories retrieved successfully');
});

// @desc    Search vendors
// @route   GET /api/search/vendors
// @access  Public
const searchVendors = asyncHandler(async (req, res) => {
  const { q, country, city, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'APPROVED',
    isActive: true
  };

  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: 'insensitive' } },
      { activities: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (country) where.country = country;
  if (city) where.city = city;

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        companyName: true,
        email: true,
        country: true,
        city: true,
        rating: true,
        reviewCount: true
      }
    }),
    prisma.vendor.count({ where })
  ]);

  paginatedResponse(res, vendors, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Vendors retrieved successfully');
});

// @desc    Search orders
// @route   GET /api/search/orders
// @access  Private
const searchOrders = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (req.userType === 'USER') {
    where.userId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }

  if (q) {
    where.orderNumber = { contains: q, mode: 'insensitive' };
  }
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  paginatedResponse(res, orders, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Orders retrieved successfully');
});

// @desc    Global search
// @route   GET /api/search/global
// @access  Public
const globalSearch = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!q) {
    return errorResponse(res, 'Please provide search query', 400);
  }

  const [products, categories, vendors] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { nameKey: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } }
        ],
        status: 'AVAILABLE'
      },
      take: parseInt(limit),
      select: {
        id: true,
        nameKey: true,
        sku: true,
        price: true
      }
    }),
    prisma.category.findMany({
      where: {
        nameKey: { contains: q, mode: 'insensitive' },
        isActive: true
      },
      take: parseInt(limit),
      select: {
        id: true,
        nameKey: true
      }
    }),
    prisma.vendor.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { activities: { contains: q, mode: 'insensitive' } }
        ],
        status: 'APPROVED'
      },
      take: parseInt(limit),
      select: {
        id: true,
        companyName: true
      }
    })
  ]);

  successResponse(res, {
    products,
    categories,
    vendors
  }, 'Global search results retrieved successfully');
});

// @desc    Image-based search
// @route   POST /api/search/image
// @access  Public
const imageSearch = asyncHandler(async (req, res) => {
  // This would implement image similarity search
  // For now, return a placeholder
  successResponse(res, {
    message: 'Image search endpoint',
    note: 'Image similarity search would be implemented here using ML/AI services'
  }, 'Image search initiated');
});

// @desc    Get user search history
// @route   GET /api/search/history
// @access  Private (User)
const getSearchHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [history, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.searchHistory.count({ where: { userId: req.user.id } })
  ]);

  paginatedResponse(res, history, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Search history retrieved successfully');
});

// @desc    Clear search history
// @route   DELETE /api/search/history
// @access  Private (User)
const clearSearchHistory = asyncHandler(async (req, res) => {
  await prisma.searchHistory.deleteMany({
    where: { userId: req.user.id }
  });

  successResponse(res, null, 'Search history cleared successfully');
});

// @desc    Save search
// @route   POST /api/search/saved
// @access  Private (User)
const saveSearch = asyncHandler(async (req, res) => {
  const { name, searchQuery, filters, entityType, emailAlerts, alertFrequency } = req.body;

  if (!name || !entityType) {
    return errorResponse(res, 'Please provide name and entityType', 400);
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId: req.user.id,
      name,
      searchQuery: searchQuery || null,
      filters: filters ? JSON.stringify(filters) : null,
      entityType,
      emailAlerts: emailAlerts || false,
      alertFrequency: alertFrequency || 'NEVER'
    }
  });

  successResponse(res, savedSearch, 'Search saved successfully', 201);
});

// @desc    Get saved searches
// @route   GET /api/search/saved
// @access  Private (User)
const getSavedSearches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [searches, total] = await Promise.all([
    prisma.savedSearch.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.savedSearch.count({ where: { userId: req.user.id } })
  ]);

  paginatedResponse(res, searches, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Saved searches retrieved successfully');
});

// @desc    Update saved search
// @route   PUT /api/search/saved/:id
// @access  Private (User)
const updateSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const savedSearch = await prisma.savedSearch.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    }
  });

  if (!savedSearch) {
    return errorResponse(res, 'Saved search not found', 404);
  }

  const data = {};
  if (updateData.name) data.name = updateData.name;
  if (updateData.emailAlerts !== undefined) data.emailAlerts = updateData.emailAlerts;
  if (updateData.alertFrequency) data.alertFrequency = updateData.alertFrequency;

  const updated = await prisma.savedSearch.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Saved search updated successfully');
});

// @desc    Delete saved search
// @route   DELETE /api/search/saved/:id
// @access  Private (User)
const deleteSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const savedSearch = await prisma.savedSearch.findFirst({
    where: {
      id: parseInt(id),
      userId: req.user.id
    }
  });

  if (!savedSearch) {
    return errorResponse(res, 'Saved search not found', 404);
  }

  await prisma.savedSearch.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Saved search deleted successfully');
});

// @desc    Get search analytics (admin)
// @route   GET /api/search/analytics
// @access  Private (Admin)
const getSearchAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [totalSearches, popularSearches, noResultSearches] = await Promise.all([
    prisma.searchHistory.count({ where }),
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
    }),
    prisma.searchHistory.findMany({
      where: {
        ...where,
        OR: [
          { resultCount: 0 },
          { resultCount: null }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  successResponse(res, {
    totalSearches,
    popularSearches: popularSearches.map(s => ({
      query: s.searchQuery,
      count: s._count
    })),
    noResultSearches: noResultSearches.map(s => s.searchQuery)
  }, 'Search analytics retrieved successfully');
});

// @desc    Get popular searches
// @route   GET /api/search/popular
// @access  Public
const getPopularSearches = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const popular = await prisma.searchHistory.groupBy({
    by: ['searchQuery'],
    where: {
      searchQuery: { not: null },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    _count: true,
    orderBy: {
      _count: {
        searchQuery: 'desc'
      }
    },
    take: parseInt(limit)
  });

  successResponse(res, popular.map(s => ({
    query: s.searchQuery,
    count: s._count
  })), 'Popular searches retrieved successfully');
});

module.exports = {
  searchProducts,
  autocomplete,
  searchCategories,
  searchVendors,
  searchOrders,
  globalSearch,
  imageSearch,
  getSearchHistory,
  clearSearchHistory,
  saveSearch,
  getSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchAnalytics,
  getPopularSearches
};



