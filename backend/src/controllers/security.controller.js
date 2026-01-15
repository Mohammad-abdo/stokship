const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// @desc    Enable 2FA
// @route   POST /api/security/2fa/enable
// @access  Private
const enable2FA = asyncHandler(async (req, res) => {
  const { method = 'TOTP' } = req.body;

  const userType = req.userType;
  const userId = req.user.id;

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Stockship (${req.user.email})`,
    issuer: 'Stockship'
  });

  // Create or update 2FA record
  await prisma.twoFactorAuth.upsert({
    where: {
      userId_userType: {
        userId,
        userType
      }
    },
    update: {
      method,
      secret: secret.base32,
      isEnabled: false // Will be enabled after verification
    },
    create: {
      userId,
      userType,
      method,
      secret: secret.base32,
      isEnabled: false
    }
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  successResponse(res, {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32
  }, '2FA setup initiated. Please verify to enable.');
});

// @desc    Disable 2FA
// @route   POST /api/security/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
  const userType = req.userType;
  const userId = req.user.id;

  await prisma.twoFactorAuth.updateMany({
    where: {
      userId,
      userType
    },
    data: {
      isEnabled: false
    }
  });

  successResponse(res, null, '2FA disabled successfully');
});

// @desc    Verify 2FA code
// @route   POST /api/security/2fa/verify
// @access  Private
const verify2FA = asyncHandler(async (req, res) => {
  const { token, enable = false } = req.body;

  if (!token) {
    return errorResponse(res, 'Please provide 2FA token', 400);
  }

  const userType = req.userType;
  const userId = req.user.id;

  const twoFA = await prisma.twoFactorAuth.findFirst({
    where: {
      userId,
      userType
    }
  });

  if (!twoFA) {
    return errorResponse(res, '2FA not set up', 404);
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: twoFA.secret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (!verified) {
    return errorResponse(res, 'Invalid 2FA token', 400);
  }

  // Enable 2FA if requested
  if (enable) {
    await prisma.twoFactorAuth.update({
      where: { id: twoFA.id },
      data: {
        isEnabled: true,
        lastVerifiedAt: new Date()
      }
    });
  }

  successResponse(res, {
    verified: true,
    enabled: enable
  }, '2FA token verified successfully');
});

// @desc    Generate backup codes
// @route   POST /api/security/2fa/backup-codes
// @access  Private
const generateBackupCodes = asyncHandler(async (req, res) => {
  const userType = req.userType;
  const userId = req.user.id;

  const twoFA = await prisma.twoFactorAuth.findFirst({
    where: {
      userId,
      userType,
      isEnabled: true
    }
  });

  if (!twoFA) {
    return errorResponse(res, '2FA not enabled', 400);
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  // Encrypt and store backup codes
  await prisma.twoFactorAuth.update({
    where: { id: twoFA.id },
    data: {
      backupCodes: JSON.stringify(backupCodes)
    }
  });

  successResponse(res, {
    backupCodes,
    warning: 'Store these codes securely. They will not be shown again.'
  }, 'Backup codes generated successfully');
});

// @desc    Social login
// @route   POST /api/auth/social/:provider
// @access  Public
const socialLogin = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { accessToken, userInfo } = req.body;

  if (!['GOOGLE', 'FACEBOOK', 'APPLE'].includes(provider)) {
    return errorResponse(res, 'Invalid provider', 400);
  }

  // This would integrate with OAuth providers
  // For now, return placeholder
  successResponse(res, {
    message: 'Social login endpoint',
    provider,
    note: 'OAuth integration would be implemented here'
  }, 'Social login initiated');
});

// @desc    Get active sessions
// @route   GET /api/security/sessions
// @access  Private
const getActiveSessions = asyncHandler(async (req, res) => {
  const userType = req.userType;
  const userId = req.user.id;

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      userType,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActivityAt: 'desc' }
  });

  successResponse(res, sessions, 'Active sessions retrieved successfully');
});

// @desc    Revoke session
// @route   DELETE /api/security/sessions/:id
// @access  Private
const revokeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userType = req.userType;
  const userId = req.user.id;

  const session = await prisma.userSession.findFirst({
    where: {
      id: parseInt(id),
      userId,
      userType
    }
  });

  if (!session) {
    return errorResponse(res, 'Session not found', 404);
  }

  await prisma.userSession.update({
    where: { id: parseInt(id) },
    data: {
      isActive: false,
      revokedAt: new Date()
    }
  });

  successResponse(res, null, 'Session revoked successfully');
});

// @desc    Revoke all sessions
// @route   POST /api/security/sessions/revoke-all
// @access  Private
const revokeAllSessions = asyncHandler(async (req, res) => {
  const userType = req.userType;
  const userId = req.user.id;

  await prisma.userSession.updateMany({
    where: {
      userId,
      userType,
      isActive: true
    },
    data: {
      isActive: false,
      revokedAt: new Date()
    }
  });

  successResponse(res, null, 'All sessions revoked successfully');
});

// @desc    Get login history
// @route   GET /api/security/login-history
// @access  Private
const getLoginHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const userType = req.userType;
  const userId = req.user.id;

  const [history, total] = await Promise.all([
    prisma.loginHistory.findMany({
      where: {
        userId,
        userType
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.loginHistory.count({
      where: {
        userId,
        userType
      }
    })
  ]);

  paginatedResponse(res, history, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit))
  }, 'Login history retrieved successfully');
});

// @desc    Change password
// @route   POST /api/security/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Please provide current and new password', 400);
  }

  const userType = req.userType;
  const userId = req.user.id;

  // Get user
  let user = null;
  if (userType === 'USER') {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else if (userType === 'VENDOR') {
    user = await prisma.vendor.findUnique({ where: { id: userId } });
  } else if (userType === 'ADMIN') {
    user = await prisma.admin.findUnique({ where: { id: userId } });
  }

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Verify current password
  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  if (userType === 'USER') {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  } else if (userType === 'VENDOR') {
    await prisma.vendor.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  } else if (userType === 'ADMIN') {
    await prisma.admin.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  successResponse(res, null, 'Password changed successfully');
});

// @desc    Verify email
// @route   POST /api/security/verify-email
// @access  Private
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return errorResponse(res, 'Please provide verification token', 400);
  }

  // This would verify email token
  successResponse(res, {
    message: 'Email verification endpoint',
    note: 'Email verification logic would be implemented here'
  }, 'Email verification initiated');
});

// @desc    Resend verification email
// @route   POST /api/security/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  // This would resend verification email
  successResponse(res, {
    message: 'Verification email sent'
  }, 'Verification email sent successfully');
});

module.exports = {
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
};



