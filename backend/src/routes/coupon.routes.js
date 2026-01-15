const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getAvailableCoupons,
  validateCoupon,
  getMyCoupons,
  createCoupon,
  getCouponById,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  generateCouponCodes,
  bulkGenerateCoupons,
  getCouponUsage,
  createVendorCoupon,
  getVendorCoupons,
  getVendorCouponAnalytics
} = require('../controllers/coupon.controller');

router.get('/available', getAvailableCoupons);
router.post('/validate', protect, validateCoupon);
router.get('/my-coupons', protect, getMyCoupons);
router.post('/admin', protect, isAdmin, createCoupon);
router.get('/admin', protect, isAdmin, getAllCoupons);
router.post('/admin/generate', protect, isAdmin, generateCouponCodes);
router.post('/admin/bulk-generate', protect, isAdmin, bulkGenerateCoupons);
router.get('/admin/:id/usage', protect, isAdmin, getCouponUsage);
router.get('/admin/:id', protect, isAdmin, getCouponById);
router.put('/admin/:id', protect, isAdmin, updateCoupon);
router.delete('/admin/:id', protect, isAdmin, deleteCoupon);
router.post('/vendor', protect, createVendorCoupon);
router.get('/vendor', protect, getVendorCoupons);
router.get('/vendor/analytics', protect, getVendorCouponAnalytics);

module.exports = router;

