const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const createRateLimiter = (maxRequests = config.rateLimit.max) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: maxRequests,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authLimiter = createRateLimiter(10); // 10 login attempts per window
const apiLimiter = createRateLimiter(100); // 100 API requests per window

module.exports = {
  authLimiter,
  apiLimiter,
  createRateLimiter,
};

