const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const emailService = require('./emailService');

class AuthService {
  async register(email, password, displayName) {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, subscription_tier, created_at`,
      [email.toLowerCase(), passwordHash, displayName || null]
    );
    
    const user = result.rows[0];
    
    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)`,
      [user.id]
    );
    
    // Create sync metadata
    await pool.query(
      `INSERT INTO sync_metadata (user_id) VALUES ($1)`,
      [user.id]
    );
    
    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail({
      email: user.email,
      displayName: user.display_name || email.split('@')[0],
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail registration if email fails
    });
    
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        subscriptionTier: user.subscription_tier,
        tier: user.subscription_tier, // Extension compatibility
        createdAt: user.created_at,
      },
      token: accessToken, // Frontend expects 'token'
      accessToken,
      refreshToken,
    };
  }
  
  async login(email, password) {
    const result = await pool.query(
      `SELECT id, email, password_hash, display_name, avatar_url, subscription_tier
       FROM users
       WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await pool.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );
    
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        subscriptionTier: user.subscription_tier,
        tier: user.subscription_tier, // Extension compatibility
      },
      token: accessToken, // Frontend expects 'token'
      accessToken,
      refreshToken,
    };
  }
  
  async loginWithGoogle(googleId, email, displayName, avatarUrl) {
    // Check if user exists
    let result = await pool.query(
      `SELECT id, email, display_name, avatar_url, subscription_tier
       FROM users
       WHERE google_id = $1 OR email = $2`,
      [googleId, email.toLowerCase()]
    );
    
    let user;
    
    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        `INSERT INTO users (email, google_id, display_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, display_name, avatar_url, subscription_tier`,
        [email.toLowerCase(), googleId, displayName, avatarUrl]
      );
      
      user = result.rows[0];
      
      // Create default settings and sync metadata
      await pool.query(`INSERT INTO user_settings (user_id) VALUES ($1)`, [user.id]);
      await pool.query(`INSERT INTO sync_metadata (user_id) VALUES ($1)`, [user.id]);
      
      // Send welcome email for new Google users (async, don't wait)
      emailService.sendWelcomeEmail({
        email: user.email,
        displayName: displayName || user.display_name || email.split('@')[0],
      }).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    } else {
      user = result.rows[0];
      
      // Update last login and google_id if needed
      await pool.query(
        `UPDATE users 
         SET last_login_at = NOW(), 
             google_id = COALESCE(google_id, $1),
             avatar_url = COALESCE($2, avatar_url)
         WHERE id = $3`,
        [googleId, avatarUrl, user.id]
      );
    }
    
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name || displayName,
        avatarUrl: user.avatar_url || avatarUrl,
        subscriptionTier: user.subscription_tier,
        tier: user.subscription_tier, // Extension compatibility
      },
      accessToken,
      refreshToken,
    };
  }
  
  async getUser(userId) {
    const result = await pool.query(
      `SELECT id, email, display_name, avatar_url, subscription_tier, created_at, last_login_at
       FROM users
       WHERE id = $1 AND is_active = true`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  }
  
  async deleteAccount(userId) {
    // Soft delete
    await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}

module.exports = new AuthService();

