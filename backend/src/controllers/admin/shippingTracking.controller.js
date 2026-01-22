const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

/**
 * @desc    Get all shipping tracking records (Admin)
 * @route   GET /api/admin/shipping-tracking
 * @access  Private (Admin)
 */
const getAllShippingTracking = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, shippingCompanyId, status, dealId, search, employeeId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  
  if (shippingCompanyId) where.shippingCompanyId = shippingCompanyId;
  if (status) where.status = status;
  if (dealId) where.dealId = dealId;
  
  // Filter by employee's deals if employeeId is provided
  if (employeeId) {
    where.deal = {
      employeeId: employeeId
    };
  }
  
  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: 'insensitive' } },
      { currentLocation: { contains: search, mode: 'insensitive' } },
      { deal: { dealNumber: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [trackings, total] = await Promise.all([
    prisma.shippingTracking.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        deal: {
          select: {
            id: true,
            dealNumber: true,
            status: true,
            negotiatedAmount: true,
            totalCartons: true,
            totalCBM: true,
            trader: {
              select: {
                id: true,
                name: true,
                companyName: true,
                traderCode: true
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true
              }
            }
          }
        },
        shippingCompany: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            avatar: true,
            phone: true,
            email: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            statusHistory: true
          }
        }
      }
    }),
    prisma.shippingTracking.count({ where })
  ]);

  paginatedResponse(res, trackings, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Shipping tracking records retrieved successfully');
});

/**
 * @desc    Get shipping tracking statistics
 * @route   GET /api/admin/shipping-tracking/stats
 * @access  Private (Admin)
 */
const getShippingTrackingStats = asyncHandler(async (req, res) => {
  const { shippingCompanyId } = req.query;

  const where = {};
  if (shippingCompanyId) where.shippingCompanyId = shippingCompanyId;

  const [
    total,
    byStatus,
    byCompany,
    recentDeliveries
  ] = await Promise.all([
    prisma.shippingTracking.count({ where }),
    prisma.shippingTracking.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    }),
    prisma.shippingTracking.groupBy({
      by: ['shippingCompanyId'],
      where: {
        ...(shippingCompanyId ? { shippingCompanyId } : where),
        shippingCompanyId: { not: null }
      },
      _count: { shippingCompanyId: true }
    }),
    prisma.shippingTracking.findMany({
      where: {
        ...where,
        status: 'DELIVERED'
      },
      orderBy: { actualDelivery: 'desc' },
      take: 10,
      include: {
        deal: {
          select: {
            dealNumber: true
          }
        },
        shippingCompany: {
          select: {
            nameEn: true,
            nameAr: true
          }
        }
      }
    })
  ]);

  // Get company names for byCompany stats
  const companyStats = await Promise.all(
    byCompany.map(async (stat) => {
      if (!stat.shippingCompanyId) return null;
      const company = await prisma.shippingCompany.findUnique({
        where: { id: stat.shippingCompanyId },
        select: {
          nameEn: true,
          nameAr: true,
          avatar: true
        }
      });
      return {
        ...stat,
        company: company || null
      };
    })
  );

  successResponse(res, {
    total,
    byStatus,
    byCompany: companyStats.filter(Boolean),
    recentDeliveries
  }, 'Shipping tracking statistics retrieved successfully');
});

module.exports = {
  getAllShippingTracking,
  getShippingTrackingStats
};

