const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// @desc    Get user's orders (USER = e-commerce orders; CLIENT = empty, mediation orders are via deals API)
// @route   GET /api/orders
// @access  Private (User | Client)
const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // CLIENT has no e-commerce orders (Order model uses userId); return empty list
  if (req.userType === 'CLIENT') {
    return paginatedResponse(res, [], {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      pages: 0
    }, 'Orders retrieved successfully');
  }

  const where = { userId: req.user.id };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true
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
    prisma.order.count({ where })
  ]);

  paginatedResponse(res, orders, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Orders retrieved successfully');
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin
// @access  Private (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, vendorId, userId, page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = parseInt(vendorId);
  if (userId) where.userId = parseInt(userId);
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { shippingAddress: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                nameKey: true,
                sku: true
              }
            }
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

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (User/Vendor/Admin/Client)
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // CLIENT has no e-commerce orders; do not expose any order by id
  if (req.userType === 'CLIENT') {
    return errorResponse(res, 'Order not found', 404);
  }

  const where = { id: parseInt(id) };

  // Users can only see their own orders
  if (req.userType === 'USER') {
    where.userId = req.user.id;
  }
  // Vendors can only see orders for their products
  else if (req.userType === 'VENDOR') {
    where.vendorId = req.user.id;
  }
  // Admins can see all orders

  const order = await prisma.order.findFirst({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      vendor: {
        select: {
          id: true,
          companyName: true,
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
              },
              vendor: {
                select: {
                  id: true,
                  companyName: true
                }
              }
            }
          }
        }
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      orderTrackings: {
        orderBy: { createdAt: 'desc' },
        include: {
          updatedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          updatedByVendor: {
            select: {
              id: true,
              companyName: true,
              email: true
            }
          },
          updatedByAdmin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      },
      acceptance: {
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  successResponse(res, order, 'Order retrieved successfully');
});

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private (User)
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    shippingCountry,
    shippingCity,
    shippingMethod,
    customsClearance,
    notes,
    paymentMethod
  } = req.body;

  if (!shippingAddress || !shippingCountry || !shippingCity || !shippingMethod) {
    return errorResponse(res, 'Please provide shipping details', 400);
  }

  // Get active cart
  const cart = await prisma.cart.findFirst({
    where: {
      userId: req.user.id,
      status: 'ACTIVE'
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: true
            }
          }
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    return errorResponse(res, 'Cart is empty', 400);
  }

  // Group items by vendor
  const itemsByVendor = {};
  cart.items.forEach(item => {
    const vendorId = item.product.vendorId;
    if (!itemsByVendor[vendorId]) {
      itemsByVendor[vendorId] = [];
    }
    itemsByVendor[vendorId].push(item);
  });

  // Get site settings
  const siteSettings = await prisma.siteSettings.findFirst();
  const commissionRate = siteSettings?.siteCommissionPercentage || 2.5;
  const taxRate = siteSettings?.taxRate || 0;

  // Create orders for each vendor
  const createdOrders = [];

  for (const [vendorId, items] of Object.entries(itemsByVendor)) {
    // Calculate totals
    let subtotal = 0;
    let totalCBM = 0;

    items.forEach(item => {
      const price = item.negotiatedPrice || item.product.price;
      const qty = item.negotiatedQuantity || item.quantity;
      subtotal += price * qty;
      if (item.product.cbm) {
        totalCBM += item.product.cbm * qty;
      }
    });

    const commission = (subtotal * commissionRate) / 100;
    const tax = (subtotal * taxRate) / 100;
    const delivery = 0; // Calculate based on shipping method
    const total = subtotal + tax + delivery + commission;

    // Apply discount if exists
    let discountAmount = 0;
    if (cart.discountCodeId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: cart.discountCodeId }
      });

      if (coupon) {
        if (coupon.couponType === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else if (coupon.couponType === 'FIXED_AMOUNT') {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const finalTotal = total - discountAmount;

    // Generate order number
    const orderNumber = `SHR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        vendorId: parseInt(vendorId),
        orderDate: new Date(),
        status: 'ORDER_RECEIVED',
        totalAmount: finalTotal,
        subtotal,
        tax,
        deliveryCharge: delivery,
        siteCommission: commission,
        discountAmount,
        discountCode: cart.discountCode,
        shippingAddress,
        shippingCountry,
        shippingCity,
        shippingMethod,
        customsClearance: customsClearance || false,
        notes: notes || null,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId,
            quantity: item.negotiatedQuantity || item.quantity,
            price: item.negotiatedPrice || item.product.price,
            cbm: item.product.cbm,
            itemNumber: item.product.sku,
            serialNumber: index + 1
          }))
        },
        tracking: {
          create: {
            status: 'ORDER_RECEIVED',
            description: 'Order received and confirmed',
            updatedBy: req.user.id,
            updatedByType: 'USER'
          }
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    createdOrders.push(order);

    // Record coupon usage if applicable
    if (cart.discountCodeId && discountAmount > 0) {
      await prisma.couponUsage.create({
        data: {
          couponId: cart.discountCodeId,
          userId: req.user.id,
          orderId: order.id,
          discountAmount
        }
      });
    }
  }

  // Update cart status
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      status: 'CONVERTED',
      convertedToOrderAt: new Date()
    }
  });

  successResponse(res, createdOrders, 'Order created successfully', 201);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Vendor/Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, description, location, trackingNumber, carrier, estimatedDelivery } = req.body;

  if (!status) {
    return errorResponse(res, 'Please provide status', 400);
  }

  // Validate status value
  const validStatuses = ['PENDING', 'ACCEPTED', 'IN_PREPARATION', 'IN_SHIPPING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Check authorization
  if (req.userType === 'VENDOR' && order.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  // Create tracking entry - set the appropriate updatedBy field based on userType
  const trackingData = {
    orderId: parseInt(id),
    status,
    description: description || `Order status updated to ${status}`,
    location: location || null,
    trackingNumber: trackingNumber || null,
    carrier: carrier || null,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    updatedByType: req.userType
  };

  // Set the appropriate updatedBy field based on userType
  if (req.userType === 'USER') {
    trackingData.updatedByUserId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    trackingData.updatedByVendorId = req.user.id;
  } else if (req.userType === 'ADMIN') {
    trackingData.updatedByAdminId = req.user.id;
  } else {
    return errorResponse(res, 'Invalid user type', 400);
  }

  try {
    await prisma.orderTracking.create({
      data: trackingData
    });
  } catch (error) {
    console.error('Error creating order tracking:', error);
    // Log error but don't fail the status update
  }

  successResponse(res, updatedOrder, 'Order status updated successfully');
});

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private (User/Admin)
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Check authorization
  if (req.userType === 'USER' && order.userId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  // Check if order can be cancelled
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
    return errorResponse(res, 'Order cannot be cancelled', 400);
  }

  // Update order
  const cancelledOrder = await prisma.order.update({
    where: { id: parseInt(id) },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: req.user.id,
      cancellationReason: reason || null
    }
  });

  // Create tracking entry - set the appropriate updatedBy field based on userType
  const trackingData = {
    orderId: parseInt(id),
    status: 'CANCELLED',
    description: reason || 'Order cancelled',
    updatedByType: req.userType
  };

  // Set the appropriate updatedBy field based on userType
  if (req.userType === 'USER') {
    trackingData.updatedByUserId = req.user.id;
  } else if (req.userType === 'VENDOR') {
    trackingData.updatedByVendorId = req.user.id;
  } else if (req.userType === 'ADMIN') {
    trackingData.updatedByAdminId = req.user.id;
  }

  await prisma.orderTracking.create({
    data: trackingData
  });

  successResponse(res, cancelledOrder, 'Order cancelled successfully');
});

// @desc    Get order tracking
// @route   GET /api/orders/:id/tracking
// @access  Private (User/Vendor/Admin)
const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // CLIENT has no e-commerce orders
  if (req.userType === 'CLIENT') {
    return errorResponse(res, 'Order not found', 404);
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      vendorId: true,
      status: true
    }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Check authorization
  if (req.userType === 'USER' && order.userId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }
  if (req.userType === 'VENDOR' && order.vendorId !== req.user.id) {
    return errorResponse(res, 'Not authorized', 403);
  }

  const tracking = await prisma.orderTracking.findMany({
    where: { orderId: parseInt(id) },
    orderBy: { createdAt: 'asc' }
  });

  successResponse(res, { order, tracking }, 'Order tracking retrieved successfully');
});

module.exports = {
  getMyOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking
};


