const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
  suspendVendor,
  activateVendor,
  getAllPayments,
  getPayment,
  getAllWallets,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  addAdminMessage
} = require('../controllers/admin.controller');
const {
  getPlatformSettings,
  updatePlatformSettings
} = require('../controllers/platformSettings.controller');
const {
  getShippingCompanies,
  getActiveShippingCompanies,
  getShippingCompanyById,
  createShippingCompany,
  updateShippingCompany,
  deleteShippingCompany
} = require('../controllers/shippingCompany.controller');
const {
  getAllShippingTracking,
  getShippingTrackingStats
} = require('../controllers/admin/shippingTracking.controller');

// Dashboard routes
router.get('/dashboard/stats', protect, isAdmin, getDashboardStats);

// User management routes
router.get('/users', protect, isAdmin, getUsers);
router.get('/users/:id', protect, isAdmin, getUser);
router.post('/users', protect, isAdmin, createUser);
router.put('/users/:id', protect, isAdmin, updateUser);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.put('/users/:id/status', protect, isAdmin, updateUserStatus);

// Vendor management routes
router.get('/vendors', protect, isAdmin, getVendors);
router.get('/vendors/:id', protect, isAdmin, getVendor);
router.post('/vendors', protect, isAdmin, createVendor);
router.put('/vendors/:id', protect, isAdmin, updateVendor);
router.delete('/vendors/:id', protect, isAdmin, deleteVendor);
router.put('/vendors/:id/approve', protect, isAdmin, approveVendor);
router.put('/vendors/:id/reject', protect, isAdmin, rejectVendor);
router.put('/vendors/:id/suspend', protect, isAdmin, suspendVendor);
router.put('/vendors/:id/activate', protect, isAdmin, activateVendor);

// Payment management routes
router.get('/payments', protect, isAdmin, getAllPayments);
router.get('/payments/:id', protect, isAdmin, getPayment);

// Wallet management routes
router.get('/wallets', protect, isAdmin, getAllWallets);

// Support ticket management routes
router.get('/support/tickets', protect, isAdmin, getAllSupportTickets);
router.get('/support/tickets/:id', protect, isAdmin, getSupportTicketById);
router.put('/support/tickets/:id/status', protect, isAdmin, updateSupportTicketStatus);
router.post('/support/tickets/:id/messages', protect, isAdmin, addAdminMessage);

// Platform settings routes
router.get('/platform-settings', protect, isAdmin, getPlatformSettings);
router.put('/platform-settings', protect, isAdmin, updatePlatformSettings);

// Shipping companies management routes
// IMPORTANT: More specific routes must come BEFORE parameterized routes
router.get('/shipping-companies/active', protect, getActiveShippingCompanies);
router.get('/shipping-companies', protect, isAdmin, getShippingCompanies);
router.get('/shipping-companies/:id', protect, isAdmin, getShippingCompanyById);
router.post('/shipping-companies', protect, isAdmin, createShippingCompany);
router.put('/shipping-companies/:id', protect, isAdmin, updateShippingCompany);
router.delete('/shipping-companies/:id', protect, isAdmin, deleteShippingCompany);

// Shipping tracking management routes
router.get('/shipping-tracking', protect, isAdmin, getAllShippingTracking);
router.get('/shipping-tracking/stats', protect, isAdmin, getShippingTrackingStats);

module.exports = router;
