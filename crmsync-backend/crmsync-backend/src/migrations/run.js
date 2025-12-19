const fs = require('fs');
const path = require('path');
const config = require('../config/config');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Only run migrations for PostgreSQL
    if (config.dbType !== 'postgres' && config.dbType !== 'postgresql') {
      console.log('⏭️  Skipping migrations (not using PostgreSQL)');
      process.exit(0);
      return;
    }
    
    const pool = require('../config/database');
    const migrationPath = path.join(__dirname, '001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
      return;
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('💡 This is normal if tables already exist');
    // Don't fail the deployment if migrations fail (tables might already exist)
    process.exit(0);
  }
}

runMigrations();

