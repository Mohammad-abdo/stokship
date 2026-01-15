const express = require('express');
const router = express.Router();
const { protect, isVendor, isAdmin, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getProductsBySeller,
  uploadProductImages,
  deleteProductImage,
  approveProduct,
  rejectProduct,
  exportProducts,
  downloadTemplate,
  importProducts
} = require('../controllers/product.controller');
const { requestPrice } = require('../controllers/priceRequest.controller');
const { getProductReviews, createProductReview, respondToReview } = require('../controllers/review.controller');
const { uploadMultiple, uploadSingle } = require('../services/upload.service');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.get('/seller/:sellerId', getProductsBySeller);

// Protected routes - Vendor/Admin
router.post('/', protect, authorize('VENDOR', 'ADMIN'), createProduct);
router.put('/:id', protect, authorize('VENDOR', 'ADMIN'), updateProduct);
router.delete('/:id', protect, authorize('VENDOR', 'ADMIN'), deleteProduct);

// Image routes - Support both file upload and URL-based images
router.post('/:id/images', protect, authorize('VENDOR', 'ADMIN'), uploadMultiple('images', 10), uploadProductImages);
router.delete('/:id/images/:imageId', protect, authorize('VENDOR', 'ADMIN'), deleteProductImage);

// Price request route
router.post('/:id/request-price', protect, requestPrice);

// Review routes
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protect, createProductReview);
router.post('/:id/reviews/:reviewId/respond', protect, respondToReview);

// Admin approval routes
router.put('/:id/approve', protect, authorize('ADMIN'), approveProduct);
router.put('/:id/reject', protect, authorize('ADMIN'), rejectProduct);

// Export/Import routes
router.get('/export', protect, authorize('VENDOR', 'ADMIN'), exportProducts);
router.get('/export/template', protect, authorize('VENDOR', 'ADMIN'), downloadTemplate);
router.post('/import', protect, authorize('VENDOR', 'ADMIN'), uploadSingle('csv'), importProducts);

module.exports = router;

