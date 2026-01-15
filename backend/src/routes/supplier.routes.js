const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSuppliers,
  getSupplierById,
  getSupplierProducts,
  getSupplierAds,
  rateSupplier
} = require('../controllers/supplier.controller');
const { getSupplierReviews, createSupplierReview } = require('../controllers/review.controller');

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.get('/:id/products', getSupplierProducts);
router.get('/:id/ads', getSupplierAds);
router.post('/:id/rate', protect, rateSupplier);
router.get('/:id/reviews', getSupplierReviews);
router.post('/:id/reviews', protect, createSupplierReview);

module.exports = router;

