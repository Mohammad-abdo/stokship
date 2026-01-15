const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  enable2FA,
  disable2FA,
  verify2FA,
  generateBackupCodes,
  socialLogin,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  changePassword,
  verifyEmail,
  resendVerification
} = require('../controllers/security.controller');

router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/backup-codes', protect, generateBackupCodes);
router.post('/auth/social/:provider', socialLogin);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/sessions/revoke-all', protect, revokeAllSessions);
router.get('/login-history', protect, getLoginHistory);
router.post('/change-password', protect, changePassword);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;



