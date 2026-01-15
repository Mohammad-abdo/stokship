const express = require('express');
const router = express.Router();
const { protect, isVendor } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getDashboardStats
} = require('../controllers/vendor.controller');

// Profile routes
router.get('/profile', protect, isVendor, getProfile);
router.put('/profile', protect, isVendor, updateProfile);

// Dashboard routes
router.get('/dashboard/stats', protect, isVendor, getDashboardStats);

module.exports = router;
