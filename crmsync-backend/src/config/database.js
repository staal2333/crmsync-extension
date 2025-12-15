require('dotenv').config();
const config = require('./config');

// Use SQLite by default (easier setup), PostgreSQL for production
const dbType = config.dbType;

let db;

if (dbType === 'sqlite') {
  console.log('📊 Using SQLite database');
  db = require('./database-sqlite');
} else {
  console.log('📊 Using PostgreSQL database');
  const { Pool } = require('pg');
  
  // Use DATABASE_URL if available (Render provides this), otherwise use individual vars
  const connectionString = process.env.DATABASE_URL;
  
  const pool = new Pool(
    connectionString 
      ? { 
          connectionString,
          ssl: { rejectUnauthorized: false } // Required for Render
        }
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        }
  );

  pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
  });

  pool.on('error', (err) => {
    console.error('❌ Database error:', err);
    process.exit(-1);
  });
  
  db = pool;
}

module.exports = db;

