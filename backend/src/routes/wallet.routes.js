const express = require('express');
const router = express.Router();
const { protect, isVendor, isAdmin } = require('../middleware/auth');
const {
  getVendorWallet,
  getVendorTransactions,
  requestPayout
} = require('../controllers/wallet.controller');

// Vendor wallet routes
router.get('/vendor', protect, isVendor, getVendorWallet);
router.get('/vendor/transactions', protect, isVendor, getVendorTransactions);
router.post('/vendor/payout-request', protect, isVendor, requestPayout);

module.exports = router;
