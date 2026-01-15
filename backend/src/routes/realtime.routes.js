const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRealtimeNotifications,
  getRealtimeOrderUpdates
} = require('../controllers/realtime.controller');

router.get('/notifications', protect, getRealtimeNotifications);
router.get('/orders/:id', protect, getRealtimeOrderUpdates);

module.exports = router;



