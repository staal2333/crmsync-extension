/**
 * Inbox Sync Routes - API endpoints for inbox scanning and syncing
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const inboxSyncService = require('../services/inboxSyncService');

/**
 * POST /api/inbox-sync/start
 * Start a full inbox sync
 */
router.post('/start', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Check if user has Pro tier
    const db = require('../config/database');
    const userResult = await db.query('SELECT subscription_tier FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userTier = (userResult.rows[0].subscription_tier || 'free').toLowerCase();
    if (userTier === 'free') {
      return res.status(403).json({ 
        error: 'Inbox sync requires Pro plan',
        upgradeRequired: true 
      });
    }

    const options = {
      dateRange: req.body.dateRange || '90d',
      updateExisting: req.body.updateExisting !== false,
      createNew: req.body.createNew !== false,
      platforms: req.body.platforms || ['hubspot', 'salesforce'],
      maxEmails: req.body.maxEmails || 5000
    };

    console.log('🚀 Starting inbox sync for user:', userId, options);

    // Start sync (this will run asynchronously)
    const syncSession = await inboxSyncService.startInboxSync(userId, options);

    res.json({
      success: true,
      syncId: syncSession.id,
      message: 'Inbox sync started',
      session: {
        id: syncSession.id,
        status: syncSession.status,
        startedAt: syncSession.startedAt,
        progress: syncSession.progress
      }
    });

  } catch (error) {
    console.error('❌ Failed to start inbox sync:', error);
    next(error);
  }
});

/**
 * GET /api/inbox-sync/status/:syncId
 * Get sync session status
 */
router.get('/status/:syncId', authenticateToken, async (req, res, next) => {
  try {
    const { syncId } = req.params;
    const userId = req.user.userId || req.user.id;

    const syncSession = inboxSyncService.getSyncSession(syncId);

    if (!syncSession) {
      return res.status(404).json({ error: 'Sync session not found' });
    }

    // Verify ownership
    if (syncSession.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      session: {
        id: syncSession.id,
        status: syncSession.status,
        startedAt: syncSession.startedAt,
        completedAt: syncSession.completedAt,
        progress: syncSession.progress,
        results: syncSession.results,
        error: syncSession.error
      }
    });

  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    next(error);
  }
});

/**
 * GET /api/inbox-sync/history
 * Get sync history for user
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const db = require('../config/database');

    const result = await db.query(
      `SELECT id, started_at, completed_at, status, emails_scanned, 
              contacts_found, contacts_updated, contacts_created
       FROM inbox_sync_history
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      history: result.rows
    });

  } catch (error) {
    console.error('❌ Failed to get sync history:', error);
    next(error);
  }
});

/**
 * POST /api/inbox-sync/cancel/:syncId
 * Cancel an active sync
 */
router.post('/cancel/:syncId', authenticateToken, async (req, res, next) => {
  try {
    const { syncId } = req.params;
    const userId = req.user.userId || req.user.id;

    const syncSession = inboxSyncService.getSyncSession(syncId);

    if (!syncSession) {
      return res.status(404).json({ error: 'Sync session not found' });
    }

    // Verify ownership
    if (syncSession.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as cancelled
    syncSession.status = 'cancelled';
    syncSession.completedAt = new Date();

    res.json({
      success: true,
      message: 'Sync cancelled'
    });

  } catch (error) {
    console.error('❌ Failed to cancel sync:', error);
    next(error);
  }
});

module.exports = router;
