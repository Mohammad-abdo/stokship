const { body, param } = require('express-validator');

// User registration validation
const validateUserRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('city').notEmpty().withMessage('City is required')
];

// User update validation
const validateUpdateUser = [
  param('id').isInt().withMessage('User ID must be a valid integer'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
];

// User ID validation
const validateUserId = [
  param('id').isInt().withMessage('User ID must be a valid integer')
];

module.exports = {
  validateUserRegister,
  validateUpdateUser,
  validateUserId
};



