const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTickets,
  createTicket,
  getTicketById,
  addMessage
} = require('../controllers/support.controller');

router.get('/tickets', protect, getTickets);
router.post('/tickets', protect, createTicket);
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/messages', protect, addMessage);

module.exports = router;
