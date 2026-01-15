const { body, param, query } = require('express-validator');

// Order creation validation
const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.productId').isInt().withMessage('Product ID must be a valid integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingCountry').notEmpty().withMessage('Shipping country is required'),
  body('shippingCity').notEmpty().withMessage('Shipping city is required')
];

// Order status update validation
const validateUpdateOrderStatus = [
  param('id').isInt().withMessage('Order ID must be a valid integer'),
  body('status').isIn(['ORDER_RECEIVED', 'PAYMENT_CONFIRMED', 'IN_PREPARATION', 'IN_SHIPPING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'AWAITING_RESPONSE'])
    .withMessage('Invalid order status')
];

// Order ID validation
const validateOrderId = [
  param('id').isInt().withMessage('Order ID must be a valid integer')
];

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateOrderId
};



