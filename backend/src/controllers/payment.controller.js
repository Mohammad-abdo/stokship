const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Process card payment
// @route   POST /api/payments/process-card
// @access  Private (User)
const processCardPayment = asyncHandler(async (req, res) => {
  const { orderId, cardDetails, billingAddress } = req.body;

  if (!orderId || !cardDetails) {
    return errorResponse(res, 'Please provide order ID and card details', 400);
  }

  // Verify order ownership
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId: req.user.id
    }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Here you would integrate with payment gateway
  // For now, creating a payment record
  const payment = await prisma.payment.create({
    data: {
      orderId: parseInt(orderId),
      userId: req.user.id,
      method: 'BANK_CARD',
      status: 'PROCESSING',
      amount: order.totalAmount,
      tax: order.tax,
      siteCommission: order.siteCommission,
      cardLast4: cardDetails.number.slice(-4),
      cardBrand: cardDetails.brand,
      billingAddress: billingAddress || null
    }
  });

  // In production, you would process payment through gateway here
  // For now, simulating success
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      transactionId: `TXN${Date.now()}`
    }
  });

  // Update order status
  await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status: 'PAYMENT_CONFIRMED' }
  });

  successResponse(res, updatedPayment, 'Payment processed successfully');
});

// @desc    Process bank transfer
// @route   POST /api/payments/process-transfer
// @access  Private (User)
const processBankTransfer = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return errorResponse(res, 'Please provide order ID', 400);
  }

  // Verify order ownership
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId: req.user.id
    }
  });

  if (!order) {
    return errorResponse(res, 'Order not found', 404);
  }

  // Get bank details from site settings or configuration
  const payment = await prisma.payment.create({
    data: {
      orderId: parseInt(orderId),
      userId: req.user.id,
      method: 'BANK_TRANSFER',
      status: 'PENDING',
      amount: order.totalAmount,
      tax: order.tax,
      siteCommission: order.siteCommission,
      bankName: 'FAB', // From config
      iban: 'AE12 3456 7890 1234 5678 901', // From config
      beneficiary: 'Mazadat Abu Dhabi LLC' // From config
    }
  });

  successResponse(res, payment, 'Bank transfer initiated. Please upload receipt.', 201);
});

// @desc    Upload bank transfer receipt
// @route   POST /api/payments/upload-receipt
// @access  Private (User)
const uploadReceipt = asyncHandler(async (req, res) => {
  const { paymentId, receiptUrl } = req.body;

  if (!paymentId || !receiptUrl) {
    return errorResponse(res, 'Please provide payment ID and receipt URL', 400);
  }

  // Verify payment ownership
  const payment = await prisma.payment.findFirst({
    where: {
      id: parseInt(paymentId),
      userId: req.user.id,
      method: 'BANK_TRANSFER'
    }
  });

  if (!payment) {
    return errorResponse(res, 'Payment not found', 404);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: parseInt(paymentId) },
    data: {
      receiptUrl,
      status: 'PENDING' // Will be verified by admin
    }
  });

  successResponse(res, updatedPayment, 'Receipt uploaded successfully');
});

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private (User/Vendor/Admin)
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const where = { id: parseInt(id) };

  // Users can only see their own payments
  if (req.userType === 'USER') {
    where.userId = req.user.id;
  }
  // Vendors can see payments for their orders
  else if (req.userType === 'VENDOR') {
    const order = await prisma.order.findFirst({
      where: {
        payment: { id: parseInt(id) },
        vendorId: req.user.id
      }
    });
    if (!order) {
      return errorResponse(res, 'Payment not found', 404);
    }
  }
  // Admins can see all payments

  const payment = await prisma.payment.findFirst({
    where,
    include: {
      order: {
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
              companyName: true
            }
          }
        }
      }
    }
  });

  if (!payment) {
    return errorResponse(res, 'Payment not found', 404);
  }

  successResponse(res, payment, 'Payment retrieved successfully');
});

// @desc    Get bank transfer details
// @route   GET /api/payments/bank-details
// @access  Public
const getBankDetails = asyncHandler(async (req, res) => {
  // This would typically come from site settings
  const bankDetails = {
    bankName: 'FAB',
    iban: 'AE12 3456 7890 1234 5678 901',
    beneficiary: 'Mazadat Abu Dhabi LLC',
    accountNumber: '1234567890'
  };

  successResponse(res, bankDetails, 'Bank details retrieved successfully');
});

module.exports = {
  processCardPayment,
  processBankTransfer,
  uploadReceipt,
  getPayment,
  getBankDetails
};



