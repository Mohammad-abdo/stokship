const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getSubCategories,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategoryById);
router.get('/:id/subcategories', getSubCategories);
router.get('/:id/products', getCategoryProducts);
  
// Admin & Employee routes
router.post('/', protect, authorize('ADMIN', 'EMPLOYEE'), createCategory);
router.put('/:id', protect, authorize('ADMIN', 'EMPLOYEE'), updateCategory);
router.delete('/:id', protect, authorize('ADMIN', 'EMPLOYEE'), deleteCategory);

module.exports = router;
