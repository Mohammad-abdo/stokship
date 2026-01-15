const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// @desc    Get company profile
// @route   GET /api/companies/:id
// @access  Public
const getCompanyProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await prisma.vendor.findUnique({
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

  if (!company) {
    return errorResponse(res, 'Company not found', 404);
  }

  successResponse(res, company, 'Company profile retrieved successfully');
});

// @desc    Get all products from company
// @route   GET /api/companies/:id/products
// @access  Public
const getCompanyProducts = asyncHandler(async (req, res) => {
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
  }, 'Company products retrieved successfully');
});

// @desc    Get company advertisements
// @route   GET /api/companies/:id/ads
// @access  Public
const getCompanyAds = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ads = await prisma.productListing.findMany({
    where: {
      vendorId: parseInt(id),
      status: 'PUBLISHED'
    },
    include: {
      category: true,
      product: {
        include: {
          images: {
            take: 1,
            orderBy: { imageOrder: 'asc' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  successResponse(res, ads, 'Company advertisements retrieved successfully');
});

// @desc    Get company profile details
// @route   GET /api/companies/:id/profile
// @access  Public
const getCompanyProfileDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const company = await prisma.vendor.findUnique({
    where: { id: parseInt(id) },
    include: {
      bankAccounts: true,
      _count: {
        select: {
          products: true,
          orders: true
        }
      }
    }
  });

  if (!company) {
    return errorResponse(res, 'Company not found', 404);
  }

  const profile = {
    id: company.id,
    companyName: company.companyName,
    businessName: company.businessName,
    activities: company.activities,
    paymentTerms: company.paymentTerms,
    shippingTerms: company.shippingTerms,
    peakSeasonLeadTime: company.peakSeasonLeadTime,
    offPeakSeasonLeadTime: company.offPeakSeasonLeadTime,
    rating: company.rating,
    reviewCount: company.reviewCount,
    isVerified: company.isVerified,
    verificationNumber: company.verificationNumber,
    bankAccounts: company.bankAccounts,
    productCount: company._count.products,
    orderCount: company._count.orders
  };

  successResponse(res, profile, 'Company profile details retrieved successfully');
});

// @desc    Update company profile
// @route   PUT /api/companies/:id/profile
// @access  Private (Vendor/Admin)
const updateCompanyProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check authorization
  if (req.userType === 'VENDOR' && req.user.id !== parseInt(id)) {
    return errorResponse(res, 'Not authorized to update this profile', 403);
  }

  const company = await prisma.vendor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!company) {
    return errorResponse(res, 'Company not found', 404);
  }

  const data = {};
  if (updateData.activities) data.activities = updateData.activities;
  if (updateData.paymentTerms) data.paymentTerms = updateData.paymentTerms;
  if (updateData.shippingTerms) data.shippingTerms = updateData.shippingTerms;
  if (updateData.peakSeasonLeadTime) data.peakSeasonLeadTime = parseInt(updateData.peakSeasonLeadTime);
  if (updateData.offPeakSeasonLeadTime) data.offPeakSeasonLeadTime = parseInt(updateData.offPeakSeasonLeadTime);

  const updated = await prisma.vendor.update({
    where: { id: parseInt(id) },
    data
  });

  successResponse(res, updated, 'Company profile updated successfully');
});

module.exports = {
  getCompanyProfile,
  getCompanyProducts,
  getCompanyAds,
  getCompanyProfileDetails,
  updateCompanyProfile
};



