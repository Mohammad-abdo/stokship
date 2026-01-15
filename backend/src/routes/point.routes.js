const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getPointBalance,
  getPointTransactions,
  getPointRules,
  redeemPoints,
  getAllUserPoints,
  getAllVendorPoints,
  adjustPoints,
  getPointAnalytics,
  updatePointRules
} = require('../controllers/point.controller');

router.get('/balance', protect, getPointBalance);
router.get('/transactions', protect, getPointTransactions);
router.get('/rules', getPointRules);
router.post('/redeem', protect, redeemPoints);
router.get('/admin/users', protect, isAdmin, getAllUserPoints);
router.get('/admin/vendors', protect, isAdmin, getAllVendorPoints);
router.post('/admin/adjust', protect, isAdmin, adjustPoints);
router.get('/admin/analytics', protect, isAdmin, getPointAnalytics);
router.put('/admin/rules', protect, isAdmin, updatePointRules);

module.exports = router;

