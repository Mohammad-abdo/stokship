const prisma = require('../../config/database');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

/**
 * @desc    Get shipping tracking for a deal
 * @route   GET /api/deals/:dealId/shipping-tracking
 * @access  Private (Client/Trader/Employee/Admin)
 */
const getShippingTracking = asyncHandler(async (req, res) => {
  const { dealId } = req.params;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      clientId: true,
      traderId: true,
      employeeId: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  // Check authorization
  if (req.userType !== 'ADMIN') {
    if (req.userType === 'CLIENT' && req.user?.id !== deal.clientId) {
      return errorResponse(res, 'Not authorized', 403);
    }
    if (req.userType === 'TRADER' && req.user?.id !== deal.traderId) {
      return errorResponse(res, 'Not authorized', 403);
    }
    if (req.userType === 'EMPLOYEE' && req.user?.id !== deal.employeeId) {
      return errorResponse(res, 'Not authorized', 403);
    }
  }

  const tracking = await prisma.shippingTracking.findUnique({
    where: { dealId },
    include: {
      shippingCompany: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          avatar: true,
          phone: true,
          email: true,
          address: true
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      },
      deal: {
        select: {
          id: true,
          dealNumber: true,
          status: true
        }
      }
    }
  });

  if (!tracking) {
    return successResponse(res, null, 'No shipping tracking found for this deal');
  }

  successResponse(res, tracking, 'Shipping tracking retrieved successfully');
});

/**
 * @desc    Create or update shipping tracking
 * @route   POST /api/deals/:dealId/shipping-tracking
 * @access  Private (Employee/Admin)
 */
const createOrUpdateShippingTracking = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const {
    shippingCompanyId,
    trackingNumber,
    status,
    currentLocation,
    estimatedDelivery,
    notes
  } = req.body;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      shippingCompany: true
    }
  });

  if (!deal) {
    return errorResponse(res, 'Deal not found', 404);
  }

  // Check authorization - only Employee/Admin can create/update tracking
  if (req.userType !== 'ADMIN' && req.userType !== 'EMPLOYEE') {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (req.userType === 'EMPLOYEE' && req.user?.id !== deal.employeeId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Validate shipping company if provided
  if (shippingCompanyId) {
    const shippingCompany = await prisma.shippingCompany.findUnique({
      where: { id: shippingCompanyId }
    });

    if (!shippingCompany) {
      return errorResponse(res, 'Shipping company not found', 404);
    }

    if (shippingCompany.status !== 'ACTIVE') {
      return errorResponse(res, 'Cannot use inactive shipping company', 400);
    }
  }

  // Check if tracking already exists
  const existingTracking = await prisma.shippingTracking.findUnique({
    where: { dealId }
  });

  let tracking;
  let isUpdate = false;
  let oldStatus = null;

  if (existingTracking) {
    // Update existing tracking
    isUpdate = true;
    oldStatus = existingTracking.status;

    const updateData = {};
    if (shippingCompanyId !== undefined) updateData.shippingCompanyId = shippingCompanyId || null;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber || null;
    if (status !== undefined) updateData.status = status;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation || null;
    if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status === 'DELIVERED' && !existingTracking.actualDelivery) {
      updateData.actualDelivery = new Date();
    }
    updateData.updatedBy = req.user.id;
    updateData.updatedByType = req.userType;

    tracking = await prisma.shippingTracking.update({
      where: { dealId },
      data: updateData,
      include: {
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
          take: 10
        }
      }
    });

    // Add status history if status changed
    if (status && status !== oldStatus) {
      await prisma.shippingStatusHistory.create({
        data: {
          shippingTrackingId: tracking.id,
          status: status,
          location: currentLocation || null,
          description: notes || `Status changed to ${status}`,
          updatedBy: req.user.id,
          updatedByType: req.userType
        }
      });
    }
  } else {
    // Create new tracking
    tracking = await prisma.shippingTracking.create({
      data: {
        dealId,
        shippingCompanyId: shippingCompanyId || deal.shippingCompanyId || null,
        trackingNumber: trackingNumber || null,
        status: status || 'PENDING',
        currentLocation: currentLocation || null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes: notes || null,
        updatedBy: req.user.id,
        updatedByType: req.userType
      },
      include: {
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
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Create initial status history
    await prisma.shippingStatusHistory.create({
      data: {
        shippingTrackingId: tracking.id,
        status: tracking.status,
        location: currentLocation || null,
        description: 'Shipping tracking created',
        updatedBy: req.user.id,
        updatedByType: req.userType
      }
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: isUpdate ? 'SHIPPING_TRACKING_UPDATED' : 'SHIPPING_TRACKING_CREATED',
      entityType: 'DEAL',
      dealId: deal.id,
      description: isUpdate
        ? `${req.userType} updated shipping tracking for deal ${deal.dealNumber}`
        : `${req.userType} created shipping tracking for deal ${deal.dealNumber}`,
      metadata: JSON.stringify({
        dealNumber: deal.dealNumber,
        trackingNumber: tracking.trackingNumber,
        status: tracking.status,
        oldStatus: oldStatus
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, tracking, isUpdate
    ? 'Shipping tracking updated successfully'
    : 'Shipping tracking created successfully');
});

/**
 * @desc    Update shipping status
 * @route   PUT /api/deals/:dealId/shipping-tracking/status
 * @access  Private (Employee/Admin)
 */
const updateShippingStatus = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  const { status, currentLocation, description, estimatedDelivery } = req.body;

  if (!status) {
    return errorResponse(res, 'Status is required', 400);
  }

  const tracking = await prisma.shippingTracking.findUnique({
    where: { dealId },
    include: {
      deal: {
        select: {
          id: true,
          dealNumber: true,
          employeeId: true
        }
      }
    }
  });

  if (!tracking) {
    return errorResponse(res, 'Shipping tracking not found', 404);
  }

  // Check authorization
  if (req.userType !== 'ADMIN' && req.userType !== 'EMPLOYEE') {
    return errorResponse(res, 'Not authorized', 403);
  }

  if (req.userType === 'EMPLOYEE' && req.user?.id !== tracking.deal.employeeId) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const updateData = {
    status,
    updatedBy: req.user.id,
    updatedByType: req.userType
  };

  if (currentLocation !== undefined) updateData.currentLocation = currentLocation || null;
  if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null;
  if (status === 'DELIVERED' && !tracking.actualDelivery) {
    updateData.actualDelivery = new Date();
  }

  const updatedTracking = await prisma.shippingTracking.update({
    where: { dealId },
    data: updateData,
    include: {
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
        take: 10
      }
    }
  });

  // Add status history
  await prisma.shippingStatusHistory.create({
    data: {
      shippingTrackingId: tracking.id,
      status,
      location: currentLocation || tracking.currentLocation || null,
      description: description || `Status changed to ${status}`,
      updatedBy: req.user.id,
      updatedByType: req.userType
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      userType: req.userType,
      action: 'SHIPPING_STATUS_UPDATED',
      entityType: 'DEAL',
      dealId: tracking.deal.id,
      description: `${req.userType} updated shipping status to ${status} for deal ${tracking.deal.dealNumber}`,
      metadata: JSON.stringify({
        dealNumber: tracking.deal.dealNumber,
        oldStatus: tracking.status,
        newStatus: status,
        trackingNumber: tracking.trackingNumber
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  successResponse(res, updatedTracking, 'Shipping status updated successfully');
});

/**
 * @desc    Get employee shipping tracking records
 * @route   GET /api/employees/shipping-tracking
 * @access  Private (Employee)
 */
const getEmployeeShippingTracking = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, shippingCompanyId, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const employeeId = req.user.id;

  const where = {
    deal: {
      employeeId: employeeId
    }
  };
  
  if (shippingCompanyId) where.shippingCompanyId = shippingCompanyId;
  if (status) where.status = status;
  
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

module.exports = {
  getShippingTracking,
  createOrUpdateShippingTracking,
  updateShippingStatus,
  getEmployeeShippingTracking
};

