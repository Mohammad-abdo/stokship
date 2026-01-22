const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').notEmpty().withMessage('Name is required'),
  validate
];

// Login validation
const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Helper function to parse ID (handles both UUID and integer)
const parseId = (id) => {
  if (!id) return null;
  // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id; // Return UUID as string
  }
  // Try to parse as integer
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? id : parsed; // Return original if not a number
};

// Helper function to create where clause for ID lookup
const createIdWhereClause = (id) => {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return { id }; // UUID
  }
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? { id } : { id: parsed }; // Integer or fallback to string
};

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  parseId,
  createIdWhereClause
};



