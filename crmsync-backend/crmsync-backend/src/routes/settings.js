const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const syncService = require('../services/syncService');
const pool = require('../config/database');

const router = express.Router();

// Get settings
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const settings = await syncService.getSettings(
      { query: (sql, params) => pool.query(sql, params) },
      req.user.userId
    );
    
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update settings
router.put('/', authenticateToken, async (req, res, next) => {
  try {
    const settings = req.body;
    
    await syncService.updateSettings(
      { query: (sql, params) => pool.query(sql, params) },
      req.user.userId,
      settings
    );
    
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

