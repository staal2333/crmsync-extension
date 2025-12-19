// Quick script to update your tier in the database
// Run with: node update-tier.js

const { Client } = require('pg');

// Your Render database connection
const DATABASE_URL = 'postgresql://crmsync_db_user:zTdGKA031a7p2cukHc3IPZSeha9Fz7wJ@dpg-d4vtb2muk2gs739l37t0-a.frankfurt-postgres.render.com/crmsync_db';

async function updateTier() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Update the user tier
    console.log('\n📝 Updating tier to PRO...');
    const updateResult = await client.query(`
      UPDATE users 
      SET subscription_tier = 'pro', 
          subscription_status = 'active',
          contact_limit = -1
      WHERE email = 'kamtim518@gmail.com'
      RETURNING email, subscription_tier, subscription_status, contact_limit
    `);

    console.log('\n✅ TIER UPDATED SUCCESSFULLY!');
    console.log('\n📊 Updated user data:');
    console.table(updateResult.rows);

    // Verify the update
    const verifyResult = await client.query(`
      SELECT email, subscription_tier, subscription_status, contact_limit, created_at
      FROM users 
      WHERE email = 'kamtim518@gmail.com'
    `);

    console.log('\n🔍 Verification - Current data in database:');
    console.table(verifyResult.rows);

    console.log('\n🎉 ALL DONE! Go refresh your website and extension!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure you:');
    console.error('   1. Replaced DATABASE_URL with your actual External URL from Render');
    console.error('   2. Have internet connection');
    console.error('   3. The database is running (check Render dashboard)');
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database.');
  }
}

updateTier();
