// Export all validators
const productValidators = require('./product.validator');
const orderValidators = require('./order.validator');
const userValidators = require('./user.validator');
const vendorValidators = require('./vendor.validator');

module.exports = {
  ...productValidators,
  ...orderValidators,
  ...userValidators,
  ...vendorValidators
};



