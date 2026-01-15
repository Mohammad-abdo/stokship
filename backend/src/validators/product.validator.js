const { body, param, query } = require('express-validator');

// Product creation validation
const validateCreateProduct = [
  body('nameKey').notEmpty().withMessage('Product name key is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('categoryId').isInt().withMessage('Category ID must be a valid integer'),
  body('country').notEmpty().withMessage('Country is required'),
  body('city').notEmpty().withMessage('City is required')
];

// Product update validation
const validateUpdateProduct = [
  param('id').isInt().withMessage('Product ID must be a valid integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
];

// Product ID validation
const validateProductId = [
  param('id').isInt().withMessage('Product ID must be a valid integer')
];

// Product search validation
const validateProductSearch = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number')
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateProductSearch
};



