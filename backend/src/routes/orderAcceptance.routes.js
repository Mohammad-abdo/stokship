const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  acceptOrder,
  rejectOrder,
  getPendingAcceptanceOrders
} = require('../controllers/orderAcceptance.controller');

router.post('/orders/:id/accept', protect, acceptOrder);
router.post('/orders/:id/reject', protect, rejectOrder);
router.get('/orders/pending-acceptance', protect, getPendingAcceptanceOrders);

module.exports = router;



