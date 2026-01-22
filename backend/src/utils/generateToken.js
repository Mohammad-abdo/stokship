const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// Validate JWT_SECRET is set
// Use a constant default secret for development to avoid "invalid signature" errors
const DEFAULT_DEV_SECRET = 'stockship-dev-secret-DO-NOT-USE-IN-PRODUCTION-change-this-immediately';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('JWT_SECRET is not set in environment variables!');
    logger.error('Please set JWT_SECRET in your .env file');
    // Use a constant default secret for development only (NOT for production!)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      logger.warn('Using default JWT_SECRET for development. This is INSECURE for production!');
      logger.warn('Please create a .env file with JWT_SECRET set to a secure random string');
      return DEFAULT_DEV_SECRET;
    }
    throw new Error('JWT_SECRET must be set in environment variables');
  }
  return secret;
};

const generateToken = (id, userType) => {
  try {
    const secret = getJWTSecret();
    return jwt.sign(
      { id, userType },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );
  } catch (error) {
    logger.error('Error generating token:', error);
    throw error;
  }
};

const generateRefreshToken = (id, userType) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || getJWTSecret();
    return jwt.sign(
      { id, userType },
      secret,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken
};



