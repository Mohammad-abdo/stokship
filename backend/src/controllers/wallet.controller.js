const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get vendor wallet
// @route   GET /api/vendor/wallet
// @access  Private (Vendor)
const getVendorWallet = asyncHandler(async (req, res) => {
  let wallet = await prisma.vendorWallet.findUnique({
    where: { vendorId: req.user.id }
  });

  if (!wallet) {
    // Create wallet if doesn't exist
    wallet = await prisma.vendorWallet.create({
      data: {
        vendorId: req.user.id,
        balance: 0,
        totalEarnings: 0,
        totalCommission: 0,
        totalPayouts: 0
      }
    });
  }

  successResponse(res, wallet, 'Wallet retrieved successfully');
});

// @desc    Get vendor wallet transactions
// @route   GET /api/vendor/wallet/transactions
// @access  Private (Vendor)
const getVendorTransactions = asyncHandler(async (req, res) => {
  const wallet = await prisma.vendorWallet.findUnique({
    where: { vendorId: req.user.id }
  });

  if (!wallet) {
    return errorResponse(res, 'Wallet not found', 404);
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: {
      walletType: 'VENDOR',
      walletId: wallet.id
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  successResponse(res, transactions, 'Transactions retrieved successfully');
});

// @desc    Request payout
// @route   POST /api/vendor/wallet/payout-request
// @access  Private (Vendor)
const requestPayout = asyncHandler(async (req, res) => {
  const { amount, bankAccountId } = req.body;

  if (!amount || !bankAccountId) {
    return errorResponse(res, 'Please provide amount and bank account ID', 400);
  }

  const wallet = await prisma.vendorWallet.findUnique({
    where: { vendorId: req.user.id }
  });

  if (!wallet) {
    return errorResponse(res, 'Wallet not found', 404);
  }

  if (wallet.balance < parseFloat(amount)) {
    return errorResponse(res, 'Insufficient balance', 400);
  }

  const minPayout = parseFloat(process.env.WALLET_MIN_PAYOUT_AMOUNT || 100);
  if (parseFloat(amount) < minPayout) {
    return errorResponse(res, `Minimum payout amount is ${minPayout}`, 400);
  }

  const payoutRequest = await prisma.payoutRequest.create({
    data: {
      vendorId: req.user.id,
      amount: parseFloat(amount),
      status: 'PENDING',
      bankAccountId: parseInt(bankAccountId)
    }
  });

  successResponse(res, payoutRequest, 'Payout request created successfully', 201);
});

module.exports = {
  getVendorWallet,
  getVendorTransactions,
  requestPayout
};



