const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProductReviews,
  createProductReview,
  getSupplierReviews,
  createSupplierReview,
  respondToReview
} = require('../controllers/review.controller');

router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', protect, createProductReview);
router.get('/suppliers/:id/reviews', getSupplierReviews);
router.post('/suppliers/:id/reviews', protect, createSupplierReview);
router.post('/products/:id/reviews/:reviewId/respond', protect, respondToReview);

module.exports = router;



