const express = require('express');
const router = express.Router();
const { protect, isUser } = require('../middleware/auth');
const {
  processCardPayment,
  processBankTransfer,
  uploadReceipt,
  getPayment,
  getBankDetails
} = require('../controllers/payment.controller');

// Public routes
router.get('/bank-details', getBankDetails);

// Payment processing routes
router.post('/process-card', protect, isUser, processCardPayment);
router.post('/process-transfer', protect, isUser, processBankTransfer);
router.post('/upload-receipt', protect, isUser, uploadReceipt);

// Payment info routes
router.get('/:id', protect, getPayment);

module.exports = router;
