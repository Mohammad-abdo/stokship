const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User)
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      countryCode: true,
      country: true,
      city: true,
      language: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, user, 'Profile retrieved successfully');
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (User)
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, countryCode, country, city, language } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(countryCode && { countryCode }),
      ...(country && { country }),
      ...(city && { city }),
      ...(language && { language })
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      countryCode: true,
      country: true,
      city: true,
      language: true,
      updatedAt: true
    }
  });

  successResponse(res, user, 'Profile updated successfully');
});

// @desc    Get user bank accounts
// @route   GET /api/users/bank-accounts
// @access  Private (User)
const getBankAccounts = asyncHandler(async (req, res) => {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId: req.user.id }
  });

  successResponse(res, bankAccounts, 'Bank accounts retrieved successfully');
});

// @desc    Add bank account
// @route   POST /api/users/bank-accounts
// @access  Private (User)
const addBankAccount = asyncHandler(async (req, res) => {
  const { accountName, accountNumber, bankName, bankAddress, bankCode, swiftCode, country, companyAddress } = req.body;

  if (!accountName || !accountNumber || !bankName) {
    return errorResponse(res, 'Please provide account name, account number, and bank name', 400);
  }

  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId: req.user.id,
      accountName,
      accountNumber,
      bankName,
      bankAddress,
      bankCode,
      swiftCode,
      country,
      companyAddress
    }
  });

  successResponse(res, bankAccount, 'Bank account added successfully', 201);
});

// @desc    Update bank account
// @route   PUT /api/users/bank-accounts/:id
// @access  Private (User)
const updateBankAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accountName, accountNumber, bankName, bankAddress, bankCode, swiftCode, country, companyAddress } = req.body;

  // Verify ownership
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: parseInt(id), userId: req.user.id }
  });

  if (!bankAccount) {
    return errorResponse(res, 'Bank account not found', 404);
  }

  const updated = await prisma.bankAccount.update({
    where: { id: parseInt(id) },
    data: {
      ...(accountName && { accountName }),
      ...(accountNumber && { accountNumber }),
      ...(bankName && { bankName }),
      ...(bankAddress && { bankAddress }),
      ...(bankCode && { bankCode }),
      ...(swiftCode && { swiftCode }),
      ...(country && { country }),
      ...(companyAddress && { companyAddress })
    }
  });

  successResponse(res, updated, 'Bank account updated successfully');
});

// @desc    Delete bank account
// @route   DELETE /api/users/bank-accounts/:id
// @access  Private (User)
const deleteBankAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: parseInt(id), userId: req.user.id }
  });

  if (!bankAccount) {
    return errorResponse(res, 'Bank account not found', 404);
  }

  await prisma.bankAccount.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Bank account deleted successfully');
});

// @desc    Get user shipping addresses
// @route   GET /api/users/shipping-addresses
// @access  Private (User)
const getShippingAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.shippingAddress.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' }
  });

  successResponse(res, addresses, 'Shipping addresses retrieved successfully');
});

// @desc    Add shipping address
// @route   POST /api/users/shipping-addresses
// @access  Private (User)
const addShippingAddress = asyncHandler(async (req, res) => {
  const { address, country, city, isDefault } = req.body;

  if (!address || !country || !city) {
    return errorResponse(res, 'Please provide address, country, and city', 400);
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false }
    });
  }

  const shippingAddress = await prisma.shippingAddress.create({
    data: {
      userId: req.user.id,
      address,
      country,
      city,
      isDefault: isDefault || false
    }
  });

  successResponse(res, shippingAddress, 'Shipping address added successfully', 201);
});

// @desc    Update shipping address
// @route   PUT /api/users/shipping-addresses/:id
// @access  Private (User)
const updateShippingAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { address, country, city, isDefault } = req.body;

  // Verify ownership
  const shippingAddress = await prisma.shippingAddress.findFirst({
    where: { id: parseInt(id), userId: req.user.id }
  });

  if (!shippingAddress) {
    return errorResponse(res, 'Shipping address not found', 404);
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: req.user.id, isDefault: true, id: { not: parseInt(id) } },
      data: { isDefault: false }
    });
  }

  const updated = await prisma.shippingAddress.update({
    where: { id: parseInt(id) },
    data: {
      ...(address && { address }),
      ...(country && { country }),
      ...(city && { city }),
      ...(isDefault !== undefined && { isDefault })
    }
  });

  successResponse(res, updated, 'Shipping address updated successfully');
});

// @desc    Delete shipping address
// @route   DELETE /api/users/shipping-addresses/:id
// @access  Private (User)
const deleteShippingAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const shippingAddress = await prisma.shippingAddress.findFirst({
    where: { id: parseInt(id), userId: req.user.id }
  });

  if (!shippingAddress) {
    return errorResponse(res, 'Shipping address not found', 404);
  }

  await prisma.shippingAddress.delete({
    where: { id: parseInt(id) }
  });

  successResponse(res, null, 'Shipping address deleted successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress
};

