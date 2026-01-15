const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');
const routes = require('./routes');
const { initWebSocket } = require('./services/websocket.service');
const { initRedis } = require('./services/cache.service');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware - Configure helmet to allow images from same origin
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http:", "https:", "*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http:", "https:", "*"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests for images
  crossOriginEmbedderPolicy: false // Allow embedding images
}));
app.use(mongoSanitize());
app.use(hpp());

// CORS configuration - Allow all origins by default
const corsAllowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['*']; // Default to allow all origins

const allowAllOrigins = corsAllowedOrigins.includes('*');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins if '*' is in allowed origins
    if (allowAllOrigins) {
      callback(null, true);
    } else if (!origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true);
    } else if (corsAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Only set credentials to true if not using wildcard *
  // IMPORTANT: Cannot use both * and credentials together
  credentials: !allowAllOrigins,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Rate limiting - General API limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

// Rate limiting - Auth routes (more lenient for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 50, // 50 requests per 15 minutes for auth (more lenient)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: 15 * 60 // seconds
    });
  }
});

// Apply auth limiter to auth routes FIRST (before general limiter)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/guest', authLimiter);

// Apply general limiter to all other API routes (with skip for auth routes)
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for auth routes (already handled above)
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  return apiLimiter(req, res, next);
});

// Serve static files (uploads) with CORS headers
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Use same allowed origins as CORS config (already defined above)
// uploadAllowedOrigins is the same as corsAllowedOrigins

// Custom middleware to serve static files with CORS
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    if (allowAllOrigins) {
      // Allow all origins - don't set credentials (they're incompatible with *)
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && corsAllowedOrigins.includes(origin)) {
      // Specific origin is allowed
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (corsAllowedOrigins.length > 0) {
      // Use first allowed origin as fallback
      res.setHeader('Access-Control-Allow-Origin', corsAllowedOrigins[0]);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Default: allow all if no specific origins set
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }
  
  // Set CORS headers for actual file requests
  // IMPORTANT: Cannot use both * and credentials together
  if (allowAllOrigins) {
    // Allow all origins - don't set credentials (they're incompatible with *)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && corsAllowedOrigins.includes(origin)) {
    // Specific origin is allowed
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (corsAllowedOrigins.length > 0) {
    // Use first allowed origin as fallback (for cases where origin header is missing)
    res.setHeader('Access-Control-Allow-Origin', corsAllowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Default: allow all if no specific origins set
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  next();
});

// Serve static files with proper headers (CORS headers should persist from middleware above)
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      const ext = filePath.split('.').pop().toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Ensure CORS headers are set (in case middleware above didn't apply)
      // IMPORTANT: Cannot use both * and credentials together
      if (allowAllOrigins) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else {
        const origin = res.req?.headers?.origin;
        if (origin && corsAllowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else if (corsAllowedOrigins.length > 0) {
          res.setHeader('Access-Control-Allow-Origin', corsAllowedOrigins[0]);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  
  // Initialize Redis cache
  if (process.env.CACHE_TYPE === 'redis') {
    await initRedis();
  }
  
  // Initialize WebSocket server
  if (process.env.WEBSOCKET_ENABLED === 'true') {
    initWebSocket(server);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

