const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createNegotiation,
  getNegotiations,
  getNegotiationById,
  respondToNegotiation,
  updateNegotiationStatus
} = require('../controllers/negotiation.controller');

router.post('/', protect, createNegotiation);
router.get('/', protect, getNegotiations);
router.get('/:id', protect, getNegotiationById);
router.put('/:id/respond', protect, respondToNegotiation);
router.put('/:id/status', protect, updateNegotiationStatus);

module.exports = router;



