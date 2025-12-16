const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints (more restrictive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 min (production-ready)
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes',
    tip: 'Please wait before trying again or reset your password.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60) + ' minutes',
      message: 'Your account has been temporarily locked for security. Please try again later.'
    });
  }
});

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 60 : 100, // 60 in prod, 100 in dev
  message: {
    error: 'Rate limit exceeded',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

// Stricter rate limiter for sync endpoints (data-heavy operations)
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 sync operations per 5 min
  message: {
    error: 'Sync rate limit exceeded',
    retryAfter: '5 minutes',
    tip: 'Automatic sync happens every 5 minutes. Manual sync should be used sparingly.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  syncLimiter,
};
