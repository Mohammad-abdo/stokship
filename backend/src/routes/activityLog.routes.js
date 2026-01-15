const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getActivityLogs,
  getLogById,
  getUserActivityLogs,
  getEntityHistory,
  exportAuditLogs,
  getSecurityAuditLogs
} = require('../controllers/activityLog.controller');

router.get('/logs', protect, isAdmin, getActivityLogs);
router.get('/logs/:id', protect, isAdmin, getLogById);
router.get('/user/:userId', protect, isAdmin, getUserActivityLogs);
router.get('/entity/:type/:id', protect, isAdmin, getEntityHistory);
router.get('/export', protect, isAdmin, exportAuditLogs);
router.get('/security', protect, isAdmin, getSecurityAuditLogs);

module.exports = router;

