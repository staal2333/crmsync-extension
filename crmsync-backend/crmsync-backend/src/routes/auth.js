const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { verifyGoogleToken } = require('../services/googleOAuth');
const { verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Register
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('displayName').optional().trim().isLength({ max: 255 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
      const { email, password, displayName } = req.body;
      const result = await authService.register(email, password, displayName);
      
      console.log(`✅ New user registered: ${email}`);
      res.status(201).json(result);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      next(error);
    }
  }
);

// Login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      console.log(`✅ User logged in: ${email}`);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      next(error);
    }
  }
);

// Google OAuth
router.post(
  '/google',
  authLimiter,
  [body('googleToken').notEmpty().withMessage('Google token is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
      const { googleToken } = req.body;
      
      const googleUser = await verifyGoogleToken(googleToken);
      
      const result = await authService.loginWithGoogle(
        googleUser.googleId,
        googleUser.email,
        googleUser.displayName,
        googleUser.avatarUrl
      );
      
      console.log(`✅ User logged in with Google: ${googleUser.email}`);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid Google token') {
        return res.status(401).json({ error: 'Invalid Google token' });
      }
      next(error);
    }
  }
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      const decoded = verifyRefreshToken(refreshToken);
      const user = await authService.getUser(decoded.userId);
      
      const newAccessToken = generateAccessToken(user.id, user.email);
      
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await authService.getUser(req.user.userId);
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        subscriptionTier: user.subscription_tier,
        tier: user.subscription_tier, // Add tier for extension compatibility
        subscriptionStatus: user.subscription_status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token deletion is primary)
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`✅ User logged out: ${req.user.email}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Delete account
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user.userId);
    console.log(`✅ Account deleted: ${req.user.email}`);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

