const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initCheckout,
  getCheckoutSession,
  calculateTotals,
  validateCheckout,
  completeCheckout,
  updateCheckoutSession
} = require('../controllers/checkout.controller');

router.post('/init', protect, initCheckout);
router.get('/session/:sessionId', protect, getCheckoutSession);
router.post('/calculate', protect, calculateTotals);
router.post('/validate', protect, validateCheckout);
router.post('/complete', protect, completeCheckout);
router.put('/session/:sessionId', protect, updateCheckoutSession);

module.exports = router;



