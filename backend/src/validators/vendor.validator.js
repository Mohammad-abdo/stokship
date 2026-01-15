const { body, param } = require('express-validator');

// Vendor registration validation
const validateVendorRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').notEmpty().withMessage('Name is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('city').notEmpty().withMessage('City is required')
];

// Vendor update validation
const validateUpdateVendor = [
  param('id').isInt().withMessage('Vendor ID must be a valid integer'),
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

// Vendor ID validation
const validateVendorId = [
  param('id').isInt().withMessage('Vendor ID must be a valid integer')
];

module.exports = {
  validateVendorRegister,
  validateUpdateVendor,
  validateVendorId
};



