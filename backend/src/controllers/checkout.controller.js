const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// @desc    Initialize checkout session
// @route   POST /api/checkout/init
// @access  Private (User)
const initCheckout = asyncHandler(async (req, res) => {
  const { cartId } = req.body;

  // Get cart
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId ? parseInt(cartId) : undefined,
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

  // Generate session ID
  const sessionId = uuidv4();

  // Get site settings
  const siteSettings = await prisma.siteSettings.findFirst();
  const commissionRate = siteSettings?.siteCommissionPercentage || 2.5;
  const taxRate = siteSettings?.taxRate || 0;

  // Calculate totals
  let subtotal = 0;
  let totalCBM = 0;

  cart.items.forEach(item => {
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

  // Create checkout session
  const checkoutSession = await prisma.checkoutSession.create({
    data: {
      sessionId,
      userId: req.user.id,
      cartId: cart.id,
      status: 'INITIATED',
      subtotal,
      tax,
      deliveryCharge: delivery,
      siteCommission: commission,
      discountAmount,
      totalAmount: finalTotal,
      discountCode: cart.discountCode,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    },
    include: {
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
    }
  });

  successResponse(res, checkoutSession, 'Checkout session initialized successfully', 201);
});

// @desc    Get checkout session
// @route   GET /api/checkout/session/:sessionId
// @access  Private (User)
const getCheckoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await prisma.checkoutSession.findFirst({
    where: {
      sessionId,
      userId: req.user.id
    },
    include: {
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
      }
    }
  });

  if (!session) {
    return errorResponse(res, 'Checkout session not found', 404);
  }

  if (session.expiresAt < new Date()) {
    return errorResponse(res, 'Checkout session has expired', 400);
  }

  successResponse(res, session, 'Checkout session retrieved successfully');
});

// @desc    Calculate order totals
// @route   POST /api/checkout/calculate
// @access  Private (User)
const calculateTotals = asyncHandler(async (req, res) => {
  const { items, shippingMethod, discountCode } = req.body;

  if (!items || !Array.isArray(items)) {
    return errorResponse(res, 'Please provide items array', 400);
  }

  // Get site settings
  const siteSettings = await prisma.siteSettings.findFirst();
  const commissionRate = siteSettings?.siteCommissionPercentage || 2.5;
  const taxRate = siteSettings?.taxRate || 0;

  // Calculate subtotal
  let subtotal = 0;
  let totalCBM = 0;

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(item.productId) }
    });

    if (!product) continue;

    const price = item.negotiatedPrice || product.price;
    const qty = item.negotiatedQuantity || item.quantity || 1;
    subtotal += price * qty;
    if (product.cbm) {
      totalCBM += product.cbm * qty;
    }
  }

  const commission = (subtotal * commissionRate) / 100;
  const tax = (subtotal * taxRate) / 100;
  const delivery = 0; // Calculate based on shipping method
  let discountAmount = 0;

  // Apply discount code if provided
  if (discountCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: discountCode.toUpperCase(),
        status: 'ACTIVE',
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() }
      }
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

  const total = subtotal + tax + delivery + commission - discountAmount;

  successResponse(res, {
    subtotal,
    tax,
    delivery,
    commission,
    discountAmount,
    total,
    totalCBM
  }, 'Order totals calculated successfully');
});

// @desc    Validate checkout data
// @route   POST /api/checkout/validate
// @access  Private (User)
const validateCheckout = asyncHandler(async (req, res) => {
  const { sessionId, shippingAddress, shippingCountry, shippingCity, shippingMethod } = req.body;

  if (!shippingAddress || !shippingCountry || !shippingCity || !shippingMethod) {
    return errorResponse(res, 'Please provide all shipping details', 400);
  }

  const session = await prisma.checkoutSession.findFirst({
    where: {
      sessionId,
      userId: req.user.id,
      status: { in: ['INITIATED', 'IN_PROGRESS'] }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!session) {
    return errorResponse(res, 'Checkout session not found', 404);
  }

  // Validate stock availability
  for (const item of session.items) {
    if (item.product.quantity < item.quantity) {
      return errorResponse(res, `Insufficient stock for product ${item.product.nameKey}`, 400);
    }
  }

  successResponse(res, { valid: true }, 'Checkout data is valid');
});

// @desc    Complete checkout
// @route   POST /api/checkout/complete
// @access  Private (User)
const completeCheckout = asyncHandler(async (req, res) => {
  const { sessionId, paymentMethod } = req.body;

  const session = await prisma.checkoutSession.findFirst({
    where: {
      sessionId,
      userId: req.user.id,
      status: { in: ['INITIATED', 'IN_PROGRESS'] }
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

  if (!session) {
    return errorResponse(res, 'Checkout session not found', 404);
  }

  if (session.expiresAt < new Date()) {
    return errorResponse(res, 'Checkout session has expired', 400);
  }

  // This will create the order - the order controller handles this
  // For now, just update session status
  const updated = await prisma.checkoutSession.update({
    where: { id: session.id },
    data: {
      status: 'COMPLETED',
      paymentMethod: paymentMethod || null,
      completedAt: new Date()
    }
  });

  successResponse(res, updated, 'Checkout completed. Proceed to payment.');
});

// @desc    Update checkout session
// @route   PUT /api/checkout/session/:sessionId
// @access  Private (User)
const updateCheckoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const updateData = req.body;

  const session = await prisma.checkoutSession.findFirst({
    where: {
      sessionId,
      userId: req.user.id
    }
  });

  if (!session) {
    return errorResponse(res, 'Checkout session not found', 404);
  }

  const data = {};
  if (updateData.shippingAddress) data.shippingAddress = updateData.shippingAddress;
  if (updateData.shippingCountry) data.shippingCountry = updateData.shippingCountry;
  if (updateData.shippingCity) data.shippingCity = updateData.shippingCity;
  if (updateData.shippingMethod) data.shippingMethod = updateData.shippingMethod;
  if (updateData.customsClearance !== undefined) data.customsClearance = updateData.customsClearance;
  if (updateData.paymentMethod) data.paymentMethod = updateData.paymentMethod;
  if (updateData.discountCode) data.discountCode = updateData.discountCode;

  const updated = await prisma.checkoutSession.update({
    where: { id: session.id },
    data
  });

  successResponse(res, updated, 'Checkout session updated successfully');
});

module.exports = {
  initCheckout,
  getCheckoutSession,
  calculateTotals,
  validateCheckout,
  completeCheckout,
  updateCheckoutSession
};



