// Quick Setup Script for SQLite (No PostgreSQL needed!)
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('🚀 CRMSYNC SQLite Setup');
console.log('=====================\n');

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('✅ Created data directory');
}

// Create database
const dbPath = path.join(dataDir, 'crmsync.db');
const db = new sqlite3.Database(dbPath);

console.log('✅ Database created:', dbPath);
console.log('\n🔄 Running migrations...\n');

// Read and execute SQL
const sqlPath = path.join(__dirname, 'src/migrations/001_initial_schema_sqlite.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Execute SQL
db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
  
  console.log('✅ Database schema created successfully!');
  console.log('\n📊 Tables created:');
  
  // List tables
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
    }
    
    console.log('\n=====================');
    console.log('✨ Setup Complete!');
    console.log('=====================\n');
    console.log('Next steps:');
    console.log('1. npm start       - Start the server');
    console.log('2. Test: curl http://localhost:3000/health');
    console.log('3. Load extension in Chrome');
    console.log('4. Sign up and start syncing!\n');
    
    db.close();
  });
});



