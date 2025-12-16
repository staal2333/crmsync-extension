const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const Sentry = require('@sentry/node');
require('dotenv').config();

const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, syncLimiter } = require('./middleware/rateLimiter');

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Sentry for production error tracking
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of requests for performance monitoring
  });
  logger.info('✅ Sentry error tracking initialized');
}

// Import routes
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const contactsRoutes = require('./routes/contacts');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Trust proxy - required for Render and other reverse proxies
app.set('trust proxy', 1);

// Sentry request handler (must be first)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      logger.warn(`HTTP request redirected to HTTPS: ${req.url}`);
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin starts with chrome-extension:// or is in allowed origins
    if (origin.startsWith('chrome-extension://') || config.cors.origins.some(o => origin.includes(o))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// IMPORTANT: Stripe webhook endpoint must be registered BEFORE body parser
// This is because Stripe requires raw body for signature verification
app.use('/api/subscription/webhook', subscriptionRoutes);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncLimiter, syncRoutes); // Apply stricter rate limit to sync
app.use('/api/contacts', contactsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', userRoutes); // GDPR compliance endpoints
app.use('/api/subscription', subscriptionRoutes); // Subscription & billing endpoints

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CRMSYNC API Server',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      sync: '/api/sync',
      contacts: '/api/contacts',
      settings: '/api/settings',
      subscription: '/api/subscription',
      user: '/api/user',
    },
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Sentry error handler (must be before other error handlers)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════╗
║      CRMSYNC API SERVER RUNNING          ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(36)}║
║  Environment: ${config.nodeEnv.padEnd(28)}║
║  Time: ${new Date().toLocaleTimeString().padEnd(33)}║
╚═══════════════════════════════════════════╝

📝 Endpoints:
   GET  /health
   GET  /
   POST /api/auth/register
   POST /api/auth/login
   POST /api/auth/google
   POST /api/auth/refresh
   GET  /api/auth/me
   POST /api/auth/logout
   POST /api/sync/full
   POST /api/sync/incremental
   GET  /api/sync/changes
   GET  /api/sync/status
   GET  /api/contacts
   POST /api/contacts
   PUT  /api/contacts/:id
   DELETE /api/contacts/:id
   GET  /api/settings
   PUT  /api/settings
   GET  /api/subscription/status
   POST /api/subscription/create-checkout
   POST /api/subscription/create-portal
   POST /api/subscription/webhook
   GET  /api/user/export
   DELETE /api/user/account
   GET  /api/user/data-summary

🔒 Authentication: Bearer token required for protected routes
💳 Stripe: Subscription management & billing
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Export logger for use in other modules
module.exports.logger = logger;

module.exports = app;

