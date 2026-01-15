const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get all suppliers/sellers
// @route   GET /api/suppliers
// @access  Public
const getSuppliers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, country, city, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'APPROVED',
    isActive: true
  };

  if (country) where.country = country;
  if (city) where.city = city;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { activities: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        rating: true,
        reviewCount: true,
        activities: true,
        isVerified: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { rating: 'desc' }
    }),
    prisma.vendor.count({ where })
  ]);

  paginatedResponse(res, suppliers, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Suppliers retrieved successfully');
});

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Public
const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await prisma.vendor.findUnique({
    where: { id: parseInt(id) },
    include: {
      bankAccounts: {
        where: { isDefault: true },
        take: 1
      },
      _count: {
        select: {
          products: true,
          orders: true
        }
      }
    }
  });

  if (!supplier) {
    return errorResponse(res, 'Supplier not found', 404);
  }

  successResponse(res, supplier, 'Supplier retrieved successfully');
});

// @desc    Get supplier's products
// @route   GET /api/suppliers/:id/products
// @access  Public
const getSupplierProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        vendorId: parseInt(id),
        status: 'AVAILABLE'
      },
      skip,
      take: parseInt(limit),
      include: {
        images: {
          take: 1,
          orderBy: { imageOrder: 'asc' }
        },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({
      where: {
        vendorId: parseInt(id),
        status: 'AVAILABLE'
      }
    })
  ]);

  paginatedResponse(res, products, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Supplier products retrieved successfully');
});

// @desc    Get supplier's advertisements
// @route   GET /api/suppliers/:id/ads
// @access  Public
const getSupplierAds = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ads = await prisma.productListing.findMany({
    where: {
      vendorId: parseInt(id),
      status: 'PUBLISHED'
    },
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, ads, 'Supplier advertisements retrieved successfully');
});

// @desc    Rate a supplier
// @route   POST /api/suppliers/:id/rate
// @access  Private (User)
const rateSupplier = asyncHandler(async (req, res) => {
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

  // Check if already rated
  const existingReview = await prisma.vendorReview.findFirst({
    where: {
      vendorId: parseInt(id),
      userId: req.user.id
    }
  });

  if (existingReview) {
    return errorResponse(res, 'You have already rated this supplier', 400);
  }

  const review = await prisma.vendorReview.create({
    data: {
      vendorId: parseInt(id),
      userId: req.user.id,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      status: 'PENDING'
    }
  });

  successResponse(res, review, 'Supplier rating submitted successfully', 201);
});

module.exports = {
  getSuppliers,
  getSupplierById,
  getSupplierProducts,
  getSupplierAds,
  rateSupplier
};



