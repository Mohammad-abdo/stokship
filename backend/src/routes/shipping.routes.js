const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  calculateShipping,
  getShippingMethods,
  trackShipment
} = require('../controllers/shipping.controller');

router.post('/calculate', calculateShipping);
router.get('/methods', getShippingMethods);
router.get('/track/:trackingNumber', protect, trackShipment);

module.exports = router;



