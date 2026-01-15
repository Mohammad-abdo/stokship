const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private (Vendor)
const getProfile = asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.user.id },
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

  if (!vendor) {
    return errorResponse(res, 'Vendor not found', 404);
  }

  successResponse(res, vendor, 'Profile retrieved successfully');
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (Vendor)
const updateProfile = asyncHandler(async (req, res) => {
  const {
    companyName,
    phone,
    country,
    city,
    activities,
    paymentTerms,
    shippingTerms,
    peakSeasonLeadTime,
    offPeakSeasonLeadTime
  } = req.body;

  const vendor = await prisma.vendor.update({
    where: { id: req.user.id },
    data: {
      ...(companyName && { companyName }),
      ...(phone && { phone }),
      ...(country && { country }),
      ...(city && { city }),
      ...(activities && { activities }),
      ...(paymentTerms && { paymentTerms }),
      ...(shippingTerms && { shippingTerms }),
      ...(peakSeasonLeadTime && { peakSeasonLeadTime: parseInt(peakSeasonLeadTime) }),
      ...(offPeakSeasonLeadTime && { offPeakSeasonLeadTime: parseInt(offPeakSeasonLeadTime) })
    }
  });

  successResponse(res, vendor, 'Profile updated successfully');
});

// @desc    Get vendor dashboard stats
// @route   GET /api/vendors/dashboard/stats
// @access  Private (Vendor)
const getDashboardStats = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;

  const [products, orders, payments, wallet] = await Promise.all([
    prisma.product.count({
      where: { vendorId }
    }),
    prisma.order.count({
      where: { vendorId }
    }),
    prisma.payment.count({
      where: {
        order: { vendorId }
      }
    }),
    prisma.vendorWallet.findUnique({
      where: { vendorId }
    })
  ]);

  const stats = {
    products,
    orders,
    payments,
    walletBalance: wallet?.balance || 0,
    totalEarnings: wallet?.totalEarnings || 0
  };

  successResponse(res, stats, 'Dashboard stats retrieved successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  getDashboardStats
};



