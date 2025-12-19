const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    const migrationFile = path.join(__dirname, '../migrations/002_add_subscriptions.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't exit - let the app continue (migrations might have already run)
    console.log('⚠️  Continuing anyway - migrations may have already been applied');
  }
}

module.exports = { runMigrations };

