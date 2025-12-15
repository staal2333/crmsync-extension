const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const contactsRoutes = require('./routes/contacts');
const settingsRoutes = require('./routes/settings');

const app = express();

// Trust proxy - required for Render and other reverse proxies
app.set('trust proxy', 1);

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
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CRMSYNC API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      sync: '/api/sync',
      contacts: '/api/contacts',
      settings: '/api/settings',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
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

🔒 Authentication: Bearer token required for protected routes
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;

