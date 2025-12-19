const express = require('express');
const { body, validationResult } = require('express-validator');
const syncService = require('../services/syncService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Full sync (for initial sync or manual sync)
router.post('/full', authenticateToken, async (req, res, next) => {
  try {
    const { lastSyncAt, localData } = req.body;
    
    const result = await syncService.fullSync(
      req.user.userId,
      lastSyncAt,
      localData
    );
    
    console.log(`✅ Full sync completed for user: ${req.user.email}`);
    res.json(result);
  } catch (error) {
    console.error('Full sync error:', error);
    next(error);
  }
});

// Incremental sync (for background sync)
router.post('/incremental', authenticateToken, async (req, res, next) => {
  try {
    const { lastSyncAt, changes } = req.body;
    
    const result = await syncService.incrementalSync(
      req.user.userId,
      lastSyncAt,
      changes || {}
    );
    
    console.log(`✅ Incremental sync completed for user: ${req.user.email}`);
    res.json(result);
  } catch (error) {
    console.error('Incremental sync error:', error);
    next(error);
  }
});

// Get changes since timestamp
router.get('/changes', authenticateToken, async (req, res, next) => {
  try {
    const { since } = req.query;
    
    const contacts = await syncService.getContactsSince(
      { query: (sql, params) => require('../config/database').query(sql, params) },
      req.user.userId,
      since
    );
    
    res.json({ contacts, since: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

// Get sync status
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const result = await require('../config/database').query(
      `SELECT last_sync_at, device_id, extension_version FROM sync_metadata WHERE user_id = $1`,
      [req.user.userId]
    );
    
    const contactCount = await syncService.getContactsCount(req.user.userId);
    
    res.json({
      lastSyncAt: result.rows[0]?.last_sync_at || null,
      deviceId: result.rows[0]?.device_id || null,
      extensionVersion: result.rows[0]?.extension_version || null,
      contactCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

