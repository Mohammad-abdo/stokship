const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Content Pages
  getAllContentPages,
  getContentPageById,
  getContentPageByType,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  // Activity Logs
  getActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByEntity
} = require('../controllers/contentPage.controller');

// ============================================
// CONTENT PAGE ROUTES (Admin)
// ============================================

// Get all content pages (with filters and pagination)
router.get('/admin/content-pages', protect, authorize('ADMIN'), getAllContentPages);

// Get content page by ID
router.get('/admin/content-pages/:id', protect, authorize('ADMIN'), getContentPageById);

// Create content page
router.post('/admin/content-pages', protect, authorize('ADMIN'), createContentPage);

// Update content page
router.put('/admin/content-pages/:id', protect, authorize('ADMIN'), updateContentPage);

// Delete content page
router.delete('/admin/content-pages/:id', protect, authorize('ADMIN'), deleteContentPage);

// ============================================
// CONTENT PAGE ROUTES (Public)
// ============================================

// Get content page by type and language (Public)
router.get('/content/:type', getContentPageByType);

// ============================================
// ACTIVITY LOG ROUTES (Admin)
// ============================================

// Get all activity logs (with filters and pagination)
router.get('/admin/activity-logs', protect, authorize('ADMIN'), getActivityLogs);

// Get activity log by ID
router.get('/admin/activity-logs/:id', protect, authorize('ADMIN'), getActivityLogById);

// Get activity logs by user
router.get('/admin/activity-logs/user/:userId', protect, authorize('ADMIN'), getActivityLogsByUser);

// Get activity logs by entity
router.get('/admin/activity-logs/entity/:entityType/:entityId', protect, authorize('ADMIN'), getActivityLogsByEntity);

module.exports = router;


