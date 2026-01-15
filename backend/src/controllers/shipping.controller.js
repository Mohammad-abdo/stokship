const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Calculate shipping costs
// @route   POST /api/shipping/calculate
// @access  Public
const calculateShipping = asyncHandler(async (req, res) => {
  const { items, shippingMethod, fromCountry, fromCity, toCountry, toCity } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse(res, 'Please provide items array', 400);
  }

  // Calculate total CBM
  let totalCBM = 0;
  for (const item of items) {
    if (item.productId && item.quantity) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
        select: { cbm: true }
      });
      if (product && product.cbm) {
        totalCBM += product.cbm * parseInt(item.quantity);
      }
    } else if (item.cbm && item.quantity) {
      totalCBM += parseFloat(item.cbm) * parseInt(item.quantity);
    }
  }

  // Calculate shipping cost based on CBM and method
  // This is a simplified calculation - in production, integrate with shipping APIs
  const baseRate = 50; // Base rate per CBM
  const shippingCost = totalCBM * baseRate;

  // Add method-specific charges
  let methodCharge = 0;
  if (shippingMethod === 'CUSTOM_AGENT') {
    methodCharge = shippingCost * 0.1; // 10% additional for custom agent
  }

  const totalShipping = shippingCost + methodCharge;

  successResponse(res, {
    totalCBM,
    baseShippingCost: shippingCost,
    methodCharge,
    totalShipping,
    estimatedDays: '5-7' // Default estimate
  }, 'Shipping cost calculated successfully');
});

// @desc    Get available shipping methods
// @route   GET /api/shipping/methods
// @access  Public
const getShippingMethods = asyncHandler(async (req, res) => {
  const methods = [
    {
      id: 'SITE_INTERMEDIARIES',
      name: 'Site Trusted Shipping Intermediaries',
      description: 'Use our trusted shipping partners',
      estimatedDays: '5-7',
      costMultiplier: 1.0
    },
    {
      id: 'CUSTOM_AGENT',
      name: 'Custom Shipping Agent',
      description: 'Use your own shipping agent',
      estimatedDays: 'Varies',
      costMultiplier: 1.1
    }
  ];

  successResponse(res, methods, 'Shipping methods retrieved successfully');
});

// @desc    Track shipment
// @route   GET /api/shipping/track/:trackingNumber
// @access  Private
const trackShipment = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;

  // Find order with this tracking number
  const order = await prisma.order.findFirst({
    where: {
      trackingNumber,
      OR: [
        { userId: req.user.id },
        { vendorId: req.user.id }
      ]
    },
    include: {
      tracking: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!order) {
    return errorResponse(res, 'Tracking number not found', 404);
  }

  successResponse(res, {
    orderNumber: order.orderNumber,
    trackingNumber: order.trackingNumber,
    carrier: order.shippingCarrier,
    status: order.status,
    tracking: order.tracking
  }, 'Shipment tracking retrieved successfully');
});

module.exports = {
  calculateShipping,
  getShippingMethods,
  trackShipment
};



