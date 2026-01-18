const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { logger } = require('../utils/logger');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      let user;
      if (decoded.userType === 'USER') {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            isEmailVerified: true
          }
        });
      } else if (decoded.userType === 'VENDOR') {
        user = await prisma.vendor.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            companyName: true,
            status: true,
            isVerified: true,
            isActive: true
          }
        });
      } else if (decoded.userType === 'ADMIN') {
        user = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            isSuperAdmin: true
          }
        });
      } else if (decoded.userType === 'EMPLOYEE') {
        user = await prisma.employee.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            employeeCode: true,
            isActive: true
          }
        });
      } else if (decoded.userType === 'TRADER') {
        user = await prisma.trader.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
            traderCode: true,
            isActive: true,
            isVerified: true
          }
        });
      } else if (decoded.userType === 'CLIENT') {
        user = await prisma.client.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      req.user = user;
      req.userType = decoded.userType;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.userType}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.userType !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is vendor
const isVendor = (req, res, next) => {
  if (req.userType !== 'VENDOR') {
    return res.status(403).json({
      success: false,
      message: 'Vendor access required'
    });
  }
  next();
};

// Check if user is regular user
const isUser = (req, res, next) => {
  if (req.userType !== 'USER') {
    return res.status(403).json({
      success: false,
      message: 'User access required'
    });
  }
  next();
};

// Optional authentication - set req.user if token exists, but don't fail if no token
const protectOptional = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token - continue as public access (req.user will be undefined)
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      let user;
      if (decoded.userType === 'ADMIN') {
        user = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            isSuperAdmin: true
          }
        });
      } else if (decoded.userType === 'EMPLOYEE') {
        user = await prisma.employee.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            employeeCode: true,
            isActive: true
          }
        });
      } else if (decoded.userType === 'TRADER') {
        user = await prisma.trader.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
            traderCode: true,
            isActive: true,
            isVerified: true
          }
        });
      } else if (decoded.userType === 'CLIENT') {
        user = await prisma.client.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        });
      } else if (decoded.userType === 'MODERATOR') {
        user = await prisma.moderator.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        });
      } else if (decoded.userType === 'MODERATOR') {
        user = await prisma.moderator.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        });
      }

      if (user && user.isActive) {
        req.user = user;
        req.userType = decoded.userType;
      }
      // If user not found or inactive, continue without req.user (public access)
      next();
    } catch (error) {
      // Invalid token - continue as public access (req.user will be undefined)
      next();
    }
  } catch (error) {
    // Any error - continue as public access (req.user will be undefined)
    next();
  }
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isVendor,
  isUser,
  protectOptional
};

