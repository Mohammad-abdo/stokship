const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  exportProducts,
  exportOrders,
  exportUsers,
  exportVendors,
  downloadTemplate,
  importProducts,
  importUsers,
  importVendors,
  previewImport,
  getImportHistory,
  getImportDetails
} = require('../controllers/exportImport.controller');

// Export routes
router.post('/products', protect, exportProducts);
router.post('/orders', protect, exportOrders);
router.post('/users', protect, isAdmin, exportUsers);
router.post('/vendors', protect, isAdmin, exportVendors);
router.get('/templates/:type', protect, downloadTemplate);

// Import routes
router.post('/products', protect, importProducts);
router.post('/users', protect, isAdmin, importUsers);
router.post('/vendors', protect, isAdmin, importVendors);
router.get('/preview', protect, previewImport);
router.get('/history', protect, getImportHistory);
router.get('/history/:id', protect, getImportDetails);

module.exports = router;
