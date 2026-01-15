const express = require('express');
const router = express.Router();
const { protect, isUser } = require('../middleware/auth');
const {
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
} = require('../controllers/user.controller');

// Profile routes
router.get('/profile', protect, isUser, getProfile);
router.put('/profile', protect, isUser, updateProfile);

// Bank account routes
router.get('/bank-accounts', protect, isUser, getBankAccounts);
router.post('/bank-accounts', protect, isUser, addBankAccount);
router.put('/bank-accounts/:id', protect, isUser, updateBankAccount);
router.delete('/bank-accounts/:id', protect, isUser, deleteBankAccount);

// Shipping address routes
router.get('/shipping-addresses', protect, isUser, getShippingAddresses);
router.post('/shipping-addresses', protect, isUser, addShippingAddress);
router.put('/shipping-addresses/:id', protect, isUser, updateShippingAddress);
router.delete('/shipping-addresses/:id', protect, isUser, deleteShippingAddress);

module.exports = router;

