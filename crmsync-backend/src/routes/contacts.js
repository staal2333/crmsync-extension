const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get all contacts with pagination and filtering
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM contacts 
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const params = [req.user.userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (
        email ILIKE $${paramIndex} OR 
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        company ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY last_contact_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND deleted_at IS NULL`,
      [req.user.userId]
    );
    
    res.json({
      contacts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
});

// Get single contact
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contacts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Get messages for this contact
    const messagesResult = await pool.query(
      `SELECT * FROM email_messages WHERE contact_id = $1 ORDER BY timestamp DESC LIMIT 100`,
      [req.params.id]
    );
    
    res.json({
      contact: result.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Create contact
router.post(
  '/',
  authenticateToken,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('company').optional().trim(),
    body('title').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    
    try {
      const { email, firstName, lastName, company, title, phone, linkedin, tags, status } = req.body;
      
      const result = await pool.query(
        `INSERT INTO contacts (
          user_id, email, first_name, last_name, company, title, phone, linkedin, tags, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          req.user.userId,
          email,
          firstName || null,
          lastName || null,
          company || null,
          title || null,
          phone || null,
          linkedin || null,
          tags || [],
          status || 'approved',
        ]
      );
      
      res.status(201).json({ contact: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Contact already exists' });
      }
      next(error);
    }
  }
);

// Update contact
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { firstName, lastName, company, title, phone, linkedin, tags, status, followUpDate } = req.body;
    
    const result = await pool.query(
      `UPDATE contacts SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        company = COALESCE($3, company),
        title = COALESCE($4, title),
        phone = COALESCE($5, phone),
        linkedin = COALESCE($6, linkedin),
        tags = COALESCE($7, tags),
        status = COALESCE($8, status),
        follow_up_date = COALESCE($9, follow_up_date),
        updated_at = NOW()
      WHERE id = $10 AND user_id = $11 AND deleted_at IS NULL
      RETURNING *`,
      [
        firstName,
        lastName,
        company,
        title,
        phone,
        linkedin,
        tags,
        status,
        followUpDate,
        req.params.id,
        req.user.userId,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ contact: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete contact (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE contacts SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
});

// Bulk operations
router.post('/bulk', authenticateToken, async (req, res, next) => {
  try {
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts array is required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const inserted = [];
      for (const contact of contacts) {
        const result = await client.query(
          `INSERT INTO contacts (
            user_id, email, first_name, last_name, company, title, phone, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, email) DO UPDATE SET
            first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
            last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
            company = COALESCE(EXCLUDED.company, contacts.company),
            title = COALESCE(EXCLUDED.title, contacts.title),
            phone = COALESCE(EXCLUDED.phone, contacts.phone),
            updated_at = NOW()
          RETURNING id`,
          [
            req.user.userId,
            contact.email,
            contact.firstName || null,
            contact.lastName || null,
            contact.company || null,
            contact.title || null,
            contact.phone || null,
            contact.status || 'approved',
          ]
        );
        inserted.push(result.rows[0].id);
      }
      
      await client.query('COMMIT');
      
      res.json({ success: true, count: inserted.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

