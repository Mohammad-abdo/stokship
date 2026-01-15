const jwt = require('jsonwebtoken');

const generateToken = (id, userType) => {
  return jwt.sign(
    { id, userType },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

const generateRefreshToken = (id, userType) => {
  return jwt.sign(
    { id, userType },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

module.exports = {
  generateToken,
  generateRefreshToken
};



