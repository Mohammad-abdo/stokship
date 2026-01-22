const express = require('express');
const router = express.Router();
const {
  register,
  login,
  guestLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  updatePreferences,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/preferences', protect, updatePreferences);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;



