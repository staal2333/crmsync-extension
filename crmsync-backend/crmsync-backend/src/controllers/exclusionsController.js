/**
 * User Exclusions Controller
 * Handles user-specific exclusion rules that follow them across devices
 */

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get user's exclusions
 * GET /api/users/exclusions
 */
exports.getExclusions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        exclude_name,
        exclude_email,
        exclude_phone,
        exclude_company,
        exclude_domains,
        exclude_emails,
        ignore_signature_matches,
        ignore_internal_threads,
        created_at,
        updated_at
      FROM user_exclusions
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // No exclusions set yet, return defaults
      return res.json({
        exclude_name: null,
        exclude_email: null,
        exclude_phone: null,
        exclude_company: null,
        exclude_domains: [],
        exclude_emails: [],
        ignore_signature_matches: true,
        ignore_internal_threads: true,
        created_at: null,
        updated_at: null
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching exclusions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exclusions',
      message: error.message 
    });
  }
};

/**
 * Save or update user's exclusions
 * POST /api/users/exclusions
 */
exports.saveExclusions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      exclude_name,
      exclude_email,
      exclude_phone,
      exclude_company,
      exclude_domains,
      exclude_emails,
      ignore_signature_matches,
      ignore_internal_threads
    } = req.body;

    // Validate arrays
    const domains = Array.isArray(exclude_domains) ? exclude_domains : [];
    const emails = Array.isArray(exclude_emails) ? exclude_emails : [];

    // Check if exclusions already exist
    const existing = await db.query(
      'SELECT id FROM user_exclusions WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE user_exclusions
        SET 
          exclude_name = $2,
          exclude_email = $3,
          exclude_phone = $4,
          exclude_company = $5,
          exclude_domains = $6,
          exclude_emails = $7,
          ignore_signature_matches = $8,
          ignore_internal_threads = $9,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          exclude_name || null,
          exclude_email || null,
          exclude_phone || null,
          exclude_company || null,
          domains,
          emails,
          ignore_signature_matches !== false,
          ignore_internal_threads !== false
        ]
      );
    } else {
      // Insert new
      result = await db.query(
        `INSERT INTO user_exclusions (
          user_id,
          exclude_name,
          exclude_email,
          exclude_phone,
          exclude_company,
          exclude_domains,
          exclude_emails,
          ignore_signature_matches,
          ignore_internal_threads
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userId,
          exclude_name || null,
          exclude_email || null,
          exclude_phone || null,
          exclude_company || null,
          domains,
          emails,
          ignore_signature_matches !== false,
          ignore_internal_threads !== false
        ]
      );
    }

    logger.info(`Exclusions saved for user ${userId}`);
    res.json({
      success: true,
      message: 'Exclusions saved successfully',
      exclusions: result.rows[0]
    });
  } catch (error) {
    logger.error('Error saving exclusions:', error);
    res.status(500).json({ 
      error: 'Failed to save exclusions',
      message: error.message 
    });
  }
};

/**
 * Update specific exclusion fields
 * PATCH /api/users/exclusions
 */
exports.updateExclusions = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Build dynamic UPDATE query
    const allowedFields = [
      'exclude_name',
      'exclude_email',
      'exclude_phone',
      'exclude_company',
      'exclude_domains',
      'exclude_emails',
      'ignore_signature_matches',
      'ignore_internal_threads'
    ];

    const setClauses = [];
    const values = [userId];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const query = `
      UPDATE user_exclusions
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exclusions not found' });
    }

    res.json({
      success: true,
      message: 'Exclusions updated successfully',
      exclusions: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating exclusions:', error);
    res.status(500).json({ 
      error: 'Failed to update exclusions',
      message: error.message 
    });
  }
};

/**
 * Delete user's exclusions
 * DELETE /api/users/exclusions
 */
exports.deleteExclusions = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      'DELETE FROM user_exclusions WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Exclusions deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting exclusions:', error);
    res.status(500).json({ 
      error: 'Failed to delete exclusions',
      message: error.message 
    });
  }
};
