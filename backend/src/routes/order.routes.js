const express = require('express');
const router = express.Router();
const { protect, isUser, isVendor, isAdmin, authorize } = require('../middleware/auth');
const {
  getMyOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking
} = require('../controllers/order.controller');

// User / Client routes (CLIENT gets empty list for e-commerce orders; mediation deals are elsewhere)
router.get('/', protect, authorize('USER', 'CLIENT'), getMyOrders);
router.get('/my-orders', protect, authorize('USER', 'CLIENT'), getMyOrders);
router.get('/my-orders/:id', protect, authorize('USER', 'CLIENT'), getOrderById);
router.get('/my-orders/:id/tracking', protect, authorize('USER', 'CLIENT'), getOrderTracking);
router.post('/', protect, isUser, createOrder);
router.post('/:id/cancel', protect, authorize('USER', 'ADMIN'), cancelOrder);

// Order acceptance routes
const { acceptOrder, rejectOrder, getPendingAcceptanceOrders } = require('../controllers/orderAcceptance.controller');
router.post('/:id/accept', protect, isVendor, acceptOrder);
router.post('/:id/reject', protect, isVendor, rejectOrder);
router.get('/pending-acceptance', protect, isVendor, getPendingAcceptanceOrders);

// Vendor routes
router.get('/vendor', protect, isVendor, getMyOrders);
router.get('/vendor/:id', protect, isVendor, getOrderById);
router.put('/vendor/:id/status', protect, isVendor, updateOrderStatus);
router.get('/vendor/:id/tracking', protect, isVendor, getOrderTracking);

// Admin routes
router.get('/admin', protect, isAdmin, getAllOrders);
router.get('/admin/:id', protect, isAdmin, getOrderById);
router.get('/admin/:id/tracking', protect, isAdmin, getOrderTracking);
router.put('/admin/:id/status', protect, isAdmin, updateOrderStatus);

// Common routes
router.get('/:id', protect, getOrderById);
router.get('/:id/tracking', protect, getOrderTracking);

module.exports = router;
