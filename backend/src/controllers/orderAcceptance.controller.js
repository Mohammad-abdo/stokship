const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Accept order
// @route   POST /api/orders/:id/accept
// @access  Private (Vendor)
const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  if (order.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to accept this order', 403);
  }

  if (order.status !== 'AWAITING_RESPONSE') {
    return errorResponse(res, 'Order is not awaiting acceptance', 400);
  }

  // Create or update order acceptance
  const orderAcceptance = await prisma.orderAcceptance.upsert({
    where: {
      orderId: parseInt(id)
    },
    update: {
      status: 'ACCEPTED',
      acceptedAt: new Date()
    },
    create: {
      orderId: parseInt(id),
      vendorId: req.user.id,
      status: 'ACCEPTED',
      acceptedAt: new Date()
    }
  });

  // Update order status
  await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status: 'PAYMENT_CONFIRMED' }
  });

  // Create tracking entry
  await prisma.orderTracking.create({
    data: {
      orderId: parseInt(id),
      status: 'PAYMENT_CONFIRMED',
      description: 'Order accepted by vendor. Payment confirmation required.',
      updatedBy: req.user.id,
      updatedByType: 'VENDOR'
    }
  });

  successResponse(res, orderAcceptance, 'Order accepted successfully');
});

// @desc    Reject order
// @route   POST /api/orders/:id/reject
// @access  Private (Vendor)
const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  if (order.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized to reject this order', 403);
  }

  if (order.status !== 'AWAITING_RESPONSE') {
    return errorResponse(res, 'Order is not awaiting acceptance', 400);
  }

  // Create or update order acceptance
  const orderAcceptance = await prisma.orderAcceptance.upsert({
    where: {
      orderId: parseInt(id)
    },
    update: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || null
    },
    create: {
      orderId: parseInt(id),
      vendorId: req.user.id,
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || null
    }
  });

  // Update order status
  await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status: 'CANCELLED' }
  });

  // Create tracking entry
  await prisma.orderTracking.create({
    data: {
      orderId: parseInt(id),
      status: 'CANCELLED',
      description: rejectionReason || 'Order rejected by vendor',
      updatedBy: req.user.id,
      updatedByType: 'VENDOR'
    }
  });

  successResponse(res, orderAcceptance, 'Order rejected successfully');
});

// @desc    Get orders pending acceptance
// @route   GET /api/orders/pending-acceptance
// @access  Private (Vendor)
const getPendingAcceptanceOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        vendorId: req.user.id,
        status: 'AWAITING_RESPONSE'
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { imageOrder: 'asc' }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({
      where: {
        vendorId: req.user.id,
        status: 'AWAITING_RESPONSE'
      }
    })
  ]);

  successResponse(res, {
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Pending acceptance orders retrieved successfully');
});

module.exports = {
  acceptOrder,
  rejectOrder,
  getPendingAcceptanceOrders
};



