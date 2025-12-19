// Update tier via backend API (alternative method)
// This uses the API endpoint that's already working

const https = require('https');

// Get your token from the website
// 1. Go to crm-sync.net/#/account
// 2. Open DevTools (F12)
// 3. Go to Console
// 4. Type: localStorage.getItem('token')
// 5. Copy the token (without quotes) and paste below

const TOKEN = 'YOUR_TOKEN_HERE';
const API_URL = 'https://crmsync-api.onrender.com';

async function updateTierViaAPI() {
  console.log('🔐 Using backend API to update tier...\n');

  if (TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('❌ ERROR: You need to get your token first!\n');
    console.log('📋 Steps to get your token:');
    console.log('   1. Go to: https://crm-sync.net/#/account');
    console.log('   2. Press F12 to open DevTools');
    console.log('   3. Go to Console tab');
    console.log('   4. Type: localStorage.getItem("token")');
    console.log('   5. Copy the token (long string)');
    console.log('   6. Edit this file and replace YOUR_TOKEN_HERE');
    console.log('   7. Run: node update-tier-via-api.js');
    console.log('\n💡 Or use the Direct SQL method below!\n');
    return;
  }

  // Make API request to get user profile
  const options = {
    hostname: 'crmsync-api.onrender.com',
    path: '/api/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('✅ API Response:', data);
      console.log('\n💡 To update manually, use the SQL method below.');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.end();
}

console.log('\n════════════════════════════════════════════════════');
console.log('  🎯 EASIEST METHOD - Direct SQL via Render Dashboard');
console.log('════════════════════════════════════════════════════\n');

console.log('📋 Step-by-step:');
console.log('\n1️⃣  Go to: https://dashboard.render.com/');
console.log('2️⃣  Click: Your "crmsync-db" database');
console.log('3️⃣  Click: "Apps" tab at the top');
console.log('4️⃣  Find: Your backend service (crmsync-backend)');
console.log('5️⃣  Click: "Shell" button (on the right)');
console.log('6️⃣  Paste this command:\n');

console.log('psql $DATABASE_URL -c "UPDATE users SET subscription_tier = \'pro\', subscription_status = \'active\', contact_limit = -1 WHERE email = \'2w@crm-sync.net\'; SELECT email, subscription_tier FROM users WHERE email = \'2w@crm-sync.net\';"');

console.log('\n7️⃣  Press Enter');
console.log('8️⃣  Should show: subscription_tier | pro ✅\n');

console.log('════════════════════════════════════════════════════');
console.log('  🔄 ALTERNATIVE - Use Backend Shell');
console.log('════════════════════════════════════════════════════\n');

console.log('1️⃣  Go to: https://dashboard.render.com/');
console.log('2️⃣  Click: Your backend service (crmsync-api)');
console.log('3️⃣  Click: "Shell" tab');
console.log('4️⃣  Type: node');
console.log('5️⃣  Paste:\n');

console.log(`const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("UPDATE users SET subscription_tier = 'pro', subscription_status = 'active', contact_limit = -1 WHERE email = '2w@crm-sync.net'")
  .then(r => console.log('✅ Updated!', r.rowCount, 'rows'))
  .then(() => pool.query("SELECT email, subscription_tier FROM users WHERE email = '2w@crm-sync.net'"))
  .then(r => console.log('📊 Result:', r.rows))
  .finally(() => process.exit());`);

console.log('\n6️⃣  Press Enter - should update! ✅\n');

console.log('════════════════════════════════════════════════════\n');

updateTierViaAPI();
