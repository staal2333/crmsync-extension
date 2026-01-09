const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

/**
 * GDPR Compliance Endpoints
 * - Data export (right to access)
 * - Account deletion (right to be forgotten)
 */

/**
 * GET /api/user/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const userResult = await db.query(
      'SELECT id, email, display_name, avatar_url, subscription_tier, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      subscriptionTier: user.subscription_tier || 'free',
      tier: user.subscription_tier || 'free',
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/export
 * Export all user data (GDPR compliance)
 */
router.get('/export', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Fetch all user data
    const userData = {
      user: null,
      contacts: [],
      messages: [],
      settings: null,
      exportedAt: new Date().toISOString()
    };
    
    // Get user info
    const userResult = await db.query(
      'SELECT id, email, display_name, avatar_url, subscription_tier, created_at FROM users WHERE id = $1',
      [userId]
    );
    userData.user = userResult.rows[0];
    
    // Get contacts
    const contactsResult = await db.query(
      'SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    userData.contacts = contactsResult.rows;
    
    // Get email messages
    const messagesResult = await db.query(
      'SELECT * FROM email_messages WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = $1) ORDER BY sent_at DESC',
      [userId]
    );
    userData.messages = messagesResult.rows;
    
    // Get settings
    const settingsResult = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    userData.settings = settingsResult.rows[0];
    
    res.json({
      message: 'User data export successful',
      data: userData,
      format: 'JSON',
      gdpr_notice: 'This export contains all personal data we store about you as required by GDPR Article 15'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/user/account
 * Delete user account and all associated data (GDPR compliance)
 */
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;
    
    if (!confirmPassword) {
      return res.status(400).json({ 
        error: 'Password confirmation required for account deletion' 
      });
    }
    
    // Verify password before deletion
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(confirmPassword, userResult.rows[0].password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Delete all user data (cascade will handle related records)
    // Order: messages -> contacts -> settings -> sync_metadata -> user
    
    await db.query('BEGIN');
    
    try {
      // Delete email messages
      await db.query(
        'DELETE FROM email_messages WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = $1)',
        [userId]
      );
      
      // Delete contacts
      await db.query('DELETE FROM contacts WHERE user_id = $1', [userId]);
      
      // Delete settings
      await db.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
      
      // Delete sync metadata
      await db.query('DELETE FROM sync_metadata WHERE user_id = $1', [userId]);
      
      // Delete user
      await db.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await db.query('COMMIT');
      
      res.json({
        message: 'Account successfully deleted',
        deleted_at: new Date().toISOString(),
        gdpr_notice: 'All your personal data has been permanently deleted as required by GDPR Article 17 (Right to Erasure)'
      });
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/data-summary
 * Get a summary of stored data
 */
router.get('/data-summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const contactsCount = await db.query(
      'SELECT COUNT(*) FROM contacts WHERE user_id = $1',
      [userId]
    );
    
    const messagesCount = await db.query(
      'SELECT COUNT(*) FROM email_messages WHERE contact_id IN (SELECT id FROM contacts WHERE user_id = $1)',
      [userId]
    );
    
    const userResult = await db.query(
      'SELECT created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );
    
    res.json({
      summary: {
        totalContacts: parseInt(contactsCount.rows[0].count),
        totalMessages: parseInt(messagesCount.rows[0].count),
        accountCreated: userResult.rows[0].created_at,
        lastLogin: userResult.rows[0].last_login_at
      },
      dataRetention: {
        policy: 'Data is retained until account deletion',
        requestExport: 'GET /api/user/export',
        requestDeletion: 'DELETE /api/user/account'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;

