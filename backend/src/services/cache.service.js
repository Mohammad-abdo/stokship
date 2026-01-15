const redis = require('redis');
const { logger } = require('../utils/logger');

let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  try {
    if (process.env.CACHE_TYPE === 'redis' && process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD || undefined
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
      });

      await redisClient.connect();
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Redis initialization error:', error);
    return false;
  }
};

// In-memory cache fallback
const memoryCache = new Map();

// Get from cache
const get = async (key) => {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(`${process.env.CACHE_PREFIX || 'stockship:'}${key}`);
      return value ? JSON.parse(value) : null;
    } else {
      // Fallback to memory cache
      const item = memoryCache.get(key);
      if (item && item.expiresAt > Date.now()) {
        return item.value;
      }
      memoryCache.delete(key);
      return null;
    }
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

// Set cache
const set = async (key, value, ttl = null) => {
  try {
    const cacheKey = `${process.env.CACHE_PREFIX || 'stockship:'}${key}`;
    const ttlSeconds = ttl || parseInt(process.env.CACHE_TTL) || 3600;

    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(value));
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
      });
    }
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
};

// Delete from cache
const del = async (key) => {
  try {
    const cacheKey = `${process.env.CACHE_PREFIX || 'stockship:'}${key}`;
    if (redisClient && redisClient.isReady) {
      await redisClient.del(cacheKey);
    } else {
      memoryCache.delete(key);
    }
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
};

// Clear cache by pattern
const clearPattern = async (pattern) => {
  try {
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys(`${process.env.CACHE_PREFIX || 'stockship:'}${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      // Clear from memory cache
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
          memoryCache.delete(key);
        }
      }
    }
    return true;
  } catch (error) {
    logger.error('Cache clear pattern error:', error);
    return false;
  }
};

// Close Redis connection
const close = async () => {
  if (redisClient && redisClient.isReady) {
    await redisClient.quit();
  }
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  clearPattern,
  close
};



