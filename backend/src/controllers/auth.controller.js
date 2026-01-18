const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const { logger } = require('../utils/logger');

// @desc    Register user/client
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, name, phone, countryCode, country, city, userType } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // Default to CLIENT for mediation platform
    const registerType = userType || 'CLIENT';

    // Check if user exists in any table (except allow same email in Client and Trader for linking)
    const existingClient = await prisma.client.findUnique({ where: { email } });
    const existingTrader = await prisma.trader.findUnique({ where: { email } });
    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    // If registering as CLIENT, allow if trader exists (we'll link them later)
    // If registering as TRADER, this should be done through employee endpoint
    if (registerType === 'CLIENT' && (existingEmployee || existingAdmin)) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // If trader exists with same email, we'll link them
    if (registerType === 'CLIENT' && existingTrader) {
      // Client and Trader can share same email - will be linked via clientId
    } else if (registerType === 'CLIENT' && existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    let token;
    let refreshToken;

    // Create user based on type
    if (registerType === 'CLIENT') {
      // Check if trader exists with same email to link them
      const linkedTrader = await prisma.trader.findUnique({ where: { email } });
      
      user = await prisma.client.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          countryCode,
          country,
          city,
          language: req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'ar'
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          city: true,
          createdAt: true
        }
      });
      // If trader exists with same email, link them
      if (linkedTrader && !linkedTrader.clientId) {
        await prisma.trader.update({
          where: { id: linkedTrader.id },
          data: { clientId: user.id }
        });
      }
      
      token = generateToken(user.id, 'CLIENT');
      refreshToken = generateRefreshToken(user.id, 'CLIENT');
    } else {
      // For other types (EMPLOYEE, TRADER), they should use specific registration endpoints
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Use specific registration endpoints for Employee or Trader.'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          ...user,
          userType: registerType
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login user/vendor/admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user = null;
    let userType = null;
    let userData = null;
    let linkedProfiles = []; // Store all matching profiles

    // Check all user types (admin, moderator, employee, trader, client) simultaneously
    const [admin, moderator, employee, trader, client] = await Promise.all([
      prisma.admin.findUnique({ where: { email } }),
      prisma.moderator.findUnique({ where: { email } }), // Added Moderator
      prisma.employee.findUnique({ where: { email } }),
      prisma.trader.findUnique({ where: { email } }),
      prisma.client.findUnique({ where: { email } })
    ]);

    // Check if email exists in any table
    if (!admin && !moderator && !employee && !trader && !client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password for each existing profile
    const profileChecks = [];
    if (admin) {
      profileChecks.push({
        user: admin,
        userType: 'ADMIN',
        checkPassword: () => bcrypt.compare(password, admin.password)
      });
    }
    if (moderator) {
      profileChecks.push({
        user: moderator,
        userType: 'MODERATOR',
        checkPassword: () => bcrypt.compare(password, moderator.password)
      });
    }
    if (employee) {
      profileChecks.push({
        user: employee,
        userType: 'EMPLOYEE',
        checkPassword: () => bcrypt.compare(password, employee.password)
      });
    }
    if (trader) {
      profileChecks.push({
        user: trader,
        userType: 'TRADER',
        checkPassword: () => bcrypt.compare(password, trader.password)
      });
    }
    if (client) {
      profileChecks.push({
        user: client,
        userType: 'CLIENT',
        checkPassword: () => bcrypt.compare(password, client.password)
      });
    }

    // Check passwords for all profiles
    const passwordChecks = await Promise.all(
      profileChecks.map(pc => pc.checkPassword())
    );

    // Find profiles with matching password
    const validProfiles = profileChecks
      .map((pc, index) => ({ ...pc, passwordMatch: passwordChecks[index] }))
      .filter(pc => {
        if (!pc.passwordMatch || !pc.user.isActive) return false;
        // For TRADER, also check if verified (approved)
        if (pc.userType === 'TRADER' && !pc.user.isVerified) return false;
        return true;
      });

    // Better error messages for debugging
    if (validProfiles.length === 0) {
      // Check if email exists in any table
      const emailExists = admin || moderator || employee || trader || client;
      
      if (emailExists) {
        // Check if any profile exists but password is wrong
        const passwordMatched = profileChecks
          .map((pc, index) => ({ ...pc, passwordMatch: passwordChecks[index] }))
          .some(pc => pc.passwordMatch);
        
        if (!passwordMatched) {
          // Password is wrong
          logger.warn(`Login attempt failed: Wrong password for email ${email}`);
          return res.status(401).json({
            success: false,
            message: 'Invalid password'
          });
        }
        
        // Password is correct but account is inactive
        const inactiveProfiles = profileChecks
          .map((pc, index) => ({ ...pc, passwordMatch: passwordChecks[index] }))
          .filter(pc => pc.passwordMatch && !pc.user.isActive);
        
        if (inactiveProfiles.length > 0) {
          logger.warn(`Login attempt failed: Inactive account for email ${email}`);
          return res.status(401).json({
            success: false,
            message: 'Account is inactive. Please contact support.'
          });
        }

        // Password is correct but account is unverified (pending approval) - TRADER only
        const unverifiedProfiles = profileChecks
          .map((pc, index) => ({ ...pc, passwordMatch: passwordChecks[index] }))
          .filter(pc => pc.passwordMatch && pc.user.isActive && pc.userType === 'TRADER' && !pc.user.isVerified);

        if (unverifiedProfiles.length > 0) {
          logger.warn(`Login attempt failed: Unverified trader account for email ${email}`);
          return res.status(403).json({
            success: false,
            message: 'Your account is under review. Please wait for admin approval.'
          });
        }
      }
      
      // Email doesn't exist or other issue
      logger.warn(`Login attempt failed: Invalid credentials for email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Priority: ADMIN > EMPLOYEE > TRADER > CLIENT
    const priority = { ADMIN: 0, EMPLOYEE: 1, TRADER: 2, CLIENT: 3 };
    validProfiles.sort((a, b) => priority[a.userType] - priority[b.userType]);

    // Primary profile (highest priority)
    const primaryProfile = validProfiles[0];
    user = primaryProfile.user;
    userType = primaryProfile.userType;

    // Collect all linked profiles (Client and Trader can be linked)
    for (const profile of validProfiles) {
      if (profile.userType === 'CLIENT') {
        linkedProfiles.push({
          id: profile.user.id,
          email: profile.user.email,
          name: profile.user.name,
          phone: profile.user.phone,
          country: profile.user.country,
          city: profile.user.city,
          isActive: profile.user.isActive,
          isEmailVerified: profile.user.isEmailVerified,
          userType: 'CLIENT'
        });
      } else if (profile.userType === 'TRADER') {
        linkedProfiles.push({
          id: profile.user.id,
          email: profile.user.email,
          name: profile.user.name,
          companyName: profile.user.companyName,
          traderCode: profile.user.traderCode,
          barcode: profile.user.barcode,
          phone: profile.user.phone,
          country: profile.user.country,
          city: profile.user.city,
          isActive: profile.user.isActive,
          isVerified: profile.user.isVerified,
          clientId: profile.user.clientId, // Include linked client ID
          userType: 'TRADER'
        });
      }
    }

    // Get primary user data
    if (userType === 'ADMIN') {
      userData = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        isSuperAdmin: admin.isSuperAdmin
      };
    } else if (userType === 'EMPLOYEE') {
      userData = {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        phone: employee.phone,
        employeeCode: employee.employeeCode,
        commissionRate: employee.commissionRate,
        isActive: employee.isActive
      };
    } else if (userType === 'MODERATOR') {
      userData = {
        id: moderator.id,
        email: moderator.email,
        name: moderator.name,
        role: moderator.role,
        isActive: moderator.isActive
      };
    } else if (userType === 'TRADER') {
      userData = {
        id: trader.id,
        email: trader.email,
        name: trader.name,
        companyName: trader.companyName,
        traderCode: trader.traderCode,
        barcode: trader.barcode,
        phone: trader.phone,
        country: trader.country,
        city: trader.city,
        isActive: trader.isActive,
        isVerified: trader.isVerified,
        clientId: trader.clientId,
        linkedProfiles: linkedProfiles.filter(p => p.userType === 'CLIENT')
      };
    } else if (userType === 'CLIENT') {
      // Check if client has linked trader (trader that references this client)
      let linkedTraderProfile = null;
      if (trader && trader.clientId === client.id) {
        linkedTraderProfile = {
          id: trader.id,
          email: trader.email,
          name: trader.name,
          companyName: trader.companyName,
          traderCode: trader.traderCode,
          barcode: trader.barcode,
          phone: trader.phone,
          country: trader.country,
          city: trader.city,
          isActive: trader.isActive,
          isVerified: trader.isVerified,
          userType: 'TRADER'
        };
      }
      
      userData = {
        id: client.id,
        email: client.email,
        name: client.name,
        phone: client.phone,
        country: client.country,
        city: client.city,
        isActive: client.isActive,
        isEmailVerified: client.isEmailVerified,
        linkedProfiles: linkedTraderProfile ? [linkedTraderProfile] : linkedProfiles.filter(p => p.userType === 'TRADER')
      };
    }

    // Update last login for primary profile
    if (userType === 'ADMIN') {
      await prisma.admin.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else if (userType === 'EMPLOYEE') {
      await prisma.employee.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else if (userType === 'MODERATOR') {
      await prisma.moderator.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else if (userType === 'TRADER') {
      await prisma.trader.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else if (userType === 'CLIENT') {
      await prisma.client.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Update last login for linked profiles
    if (userType === 'CLIENT' && trader && trader.clientId === client.id) {
      await prisma.trader.update({
        where: { id: trader.id },
        data: { lastLoginAt: new Date() }
      });
    } else if (userType === 'TRADER' && trader && trader.clientId && client && client.id === trader.clientId) {
      await prisma.client.update({
        where: { id: client.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Generate token for primary profile
    const expiresIn = rememberMe ? '30d' : process.env.JWT_EXPIRES_IN || '30d';
    const token = generateToken(user.id, userType);
    const refreshToken = generateRefreshToken(user.id, userType);

    // Generate tokens for all valid profiles (Client and Trader can be linked)
    const roleTokens = {};
    const roleRefreshTokens = {};
    const roleProfiles = {}; // Store full profile data for each role
    
    for (const profile of validProfiles) {
      // Only generate tokens for CLIENT and TRADER (they can be linked)
      if (profile.userType === 'CLIENT' || profile.userType === 'TRADER') {
        const profileToken = generateToken(profile.user.id, profile.userType);
        const profileRefreshToken = generateRefreshToken(profile.user.id, profile.userType);
        roleTokens[profile.userType] = profileToken;
        roleRefreshTokens[profile.userType] = profileRefreshToken;
        
        // Store full profile data
        if (profile.userType === 'CLIENT') {
          roleProfiles[profile.userType] = {
            id: profile.user.id,
            email: profile.user.email,
            name: profile.user.name,
            phone: profile.user.phone,
            country: profile.user.country,
            city: profile.user.city,
            isActive: profile.user.isActive,
            isEmailVerified: profile.user.isEmailVerified,
            userType: 'CLIENT'
          };
        } else if (profile.userType === 'TRADER') {
          roleProfiles[profile.userType] = {
            id: profile.user.id,
            email: profile.user.email,
            name: profile.user.name,
            companyName: profile.user.companyName,
            traderCode: profile.user.traderCode,
            barcode: profile.user.barcode,
            phone: profile.user.phone,
            country: profile.user.country,
            city: profile.user.city,
            isActive: profile.user.isActive,
            isVerified: profile.user.isVerified,
            clientId: profile.user.clientId,
            userType: 'TRADER'
          };
        }
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          ...userData,
          userType
        },
        token,
        refreshToken,
        availableRoles: validProfiles.map(p => p.userType), // List of all available roles
        linkedProfiles: userData.linkedProfiles || [], // Linked client/trader profiles
        roleTokens, // Tokens for each available role (CLIENT and TRADER)
        roleRefreshTokens, // Refresh tokens for each available role
        roleProfiles // Full profile data for each role (CLIENT and TRADER)
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Guest login
// @route   POST /api/auth/guest
// @access  Public
const guestLogin = async (req, res) => {
  try {
    // Create guest client
    const guestUser = await prisma.client.create({
      data: {
        email: `guest_${Date.now()}@guest.stockship.com`,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        name: 'Guest User',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    const token = generateToken(guestUser.id, 'CLIENT');

    res.status(201).json({
      success: true,
      data: {
        user: guestUser,
        token
      }
    });
  } catch (error) {
    logger.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let user;

    if (req.userType === 'CLIENT') {
      user = await prisma.client.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          countryCode: true,
          country: true,
          city: true,
          isActive: true,
          isEmailVerified: true,
          language: true,
          createdAt: true
        }
      });
    } else if (req.userType === 'EMPLOYEE') {
      user = await prisma.employee.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          employeeCode: true,
          commissionRate: true,
          isActive: true,
          createdAt: true
        }
      });
    } else if (req.userType === 'TRADER') {
      user = await prisma.trader.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          traderCode: true,
          barcode: true,
          qrCodeUrl: true,
          phone: true,
          country: true,
          city: true,
          isActive: true,
          isVerified: true,
          createdAt: true
        }
      });
    } else if (req.userType === 'ADMIN') {
      user = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isSuperAdmin: true
        }
      });
    }

    // Add userType to response
    const userWithType = {
      ...user,
      userType: req.userType
    };

    res.json({
      success: true,
      data: userWithType
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, countryCode, country, city, companyName } = req.body;

    let updatedUser;

    if (req.userType === 'CLIENT') {
      updatedUser = await prisma.client.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(countryCode && { countryCode }),
          ...(country && { country }),
          ...(city && { city })
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          city: true
        }
      });
    } else if (req.userType === 'TRADER') {
      updatedUser = await prisma.trader.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(country && { country }),
          ...(city && { city }),
          ...(req.body.companyName && { companyName: req.body.companyName }),
          ...(req.body.companyAddress && { companyAddress: req.body.companyAddress }),
          ...(req.body.bankAccountName && { bankAccountName: req.body.bankAccountName }),
          ...(req.body.bankAccountNumber && { bankAccountNumber: req.body.bankAccountNumber }),
          ...(req.body.bankName && { bankName: req.body.bankName }),
          ...(req.body.bankAddress && { bankAddress: req.body.bankAddress }),
          ...(req.body.bankCode && { bankCode: req.body.bankCode }),
          ...(req.body.swiftCode && { swiftCode: req.body.swiftCode })
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          city: true,
          companyName: true,
          companyAddress: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankName: true,
          bankAddress: true,
          bankCode: true,
          swiftCode: true
        }
      });
    } else if (req.userType === 'EMPLOYEE') {
      updatedUser = await prisma.employee.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone })
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true
        }
      });
    }

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // TODO: Implement password reset email sending
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and password'
      });
    }

    // TODO: Implement password reset logic
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // TODO: Implement token blacklisting
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide refresh token'
      });
    }

    // TODO: Implement refresh token logic
    res.json({
      success: true,
      message: 'Token refreshed'
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // TODO: Implement email verification with token
    // Verify token and update user email verification status
    res.json({
      success: true,
      message: 'Email verified'
    });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Resend verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res) => {
  try {
    // TODO: Implement resend verification email
    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  guestLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification
};
