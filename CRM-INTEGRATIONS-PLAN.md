# 🚀 CRM Integrations Implementation Plan
## HubSpot & Salesforce Integration

**Date:** December 17, 2025  
**Priority:** HIGH - Core Feature  
**Estimated Time:** 3-5 days of focused work  

---

## 📋 **OVERVIEW**

We'll build **native integrations** with HubSpot and Salesforce, allowing users to:
1. ✅ Connect their CRM accounts via OAuth
2. ✅ Push contacts directly from the extension
3. ✅ Map fields automatically
4. ✅ Handle duplicates intelligently
5. ✅ Show sync status in real-time

---

## 🎯 **WHAT USERS WILL BE ABLE TO DO**

```
1. Go to Extension Settings → "Integrations"
2. Click "Connect HubSpot" or "Connect Salesforce"
3. Authorize via OAuth popup
4. Select default settings (duplicate handling, field mapping)
5. From any contact → Click "Add to HubSpot" or "Add to Salesforce"
6. Contact is created in CRM instantly
7. See sync status: ✓ Synced, ⚠️ Duplicate, ❌ Error
```

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **3-Tier System:**

```
┌─────────────────┐
│  Chrome         │
│  Extension      │  1. User clicks "Add to HubSpot"
│  (Frontend)     │  2. Sends contact data to backend
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Node.js        │
│  Backend        │  3. Validates request
│  (Middleware)   │  4. Handles OAuth tokens
│                 │  5. Calls CRM API
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  HubSpot /      │
│  Salesforce     │  6. Creates/updates contact
│  API            │  7. Returns success/error
└─────────────────┘
```

**Why Backend?**
- OAuth tokens must be stored securely (NOT in extension)
- API credentials are server-side only
- Rate limiting and retry logic
- Better error handling and logging

---

## 📊 **IMPLEMENTATION PHASES**

### **Phase 1: Setup & Infrastructure (Day 1)** ⏱️ 4-6 hours

**Tasks:**
1. Create developer accounts
2. Set up OAuth apps
3. Create database tables for tokens
4. Set up backend routes

---

### **Phase 2: HubSpot Integration (Day 2)** ⏱️ 6-8 hours

**Tasks:**
1. Implement HubSpot OAuth flow
2. Create contact creation API
3. Handle duplicate detection
4. Test end-to-end

---

### **Phase 3: Salesforce Integration (Day 3)** ⏱️ 6-8 hours

**Tasks:**
1. Implement Salesforce OAuth flow
2. Create contact/lead creation API
3. Handle duplicate detection
4. Test end-to-end

---

### **Phase 4: Extension UI (Day 4)** ⏱️ 4-6 hours

**Tasks:**
1. Add "Integrations" tab in settings
2. Add OAuth connection buttons
3. Add "Push to CRM" buttons on contacts
4. Show sync status indicators

---

### **Phase 5: Testing & Polish (Day 5)** ⏱️ 4-6 hours

**Tasks:**
1. Test all edge cases
2. Add error messages
3. Handle token expiration
4. Add disconnect functionality
5. Document for users

---

## 🔐 **PHASE 1 DETAILS: SETUP & INFRASTRUCTURE**

### **Step 1.1: Create Developer Accounts**

#### **HubSpot:**
1. Go to https://developers.hubspot.com/
2. Create a developer account (free)
3. Create an app
4. Note down:
   - Client ID
   - Client Secret
   - Redirect URI: `https://crmsync-api.onrender.com/api/integrations/hubspot/callback`

#### **Salesforce:**
1. Go to https://developer.salesforce.com/
2. Sign up for Developer Edition (free)
3. Create a Connected App
4. Note down:
   - Consumer Key (Client ID)
   - Consumer Secret
   - Redirect URI: `https://crmsync-api.onrender.com/api/integrations/salesforce/callback`

---

### **Step 1.2: Update Database Schema**

**New Table: `crm_integrations`**

```sql
CREATE TABLE crm_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'hubspot' or 'salesforce'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  instance_url VARCHAR(255), -- For Salesforce
  portal_id VARCHAR(255), -- For HubSpot
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Field mappings, duplicate handling
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_crm_integrations_user ON crm_integrations(user_id);
```

**New Table: `crm_sync_logs`**

```sql
CREATE TABLE crm_sync_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'duplicate'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'skipped'
  crm_contact_id VARCHAR(255), -- ID in the CRM
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_user ON crm_sync_logs(user_id);
CREATE INDEX idx_sync_logs_contact ON crm_sync_logs(contact_id);
```

---

### **Step 1.3: Add Environment Variables**

**Add to Render backend:**

```env
# HubSpot
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_REDIRECT_URI=https://crmsync-api.onrender.com/api/integrations/hubspot/callback

# Salesforce
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_REDIRECT_URI=https://crmsync-api.onrender.com/api/integrations/salesforce/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com
```

---

### **Step 1.4: Create Backend Routes Structure**

**New File: `crmsync-backend/src/routes/integrations.js`**

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// HubSpot routes
router.get('/hubspot/connect', authenticateToken, hubspotConnect);
router.get('/hubspot/callback', hubspotCallback);
router.post('/hubspot/sync-contact', authenticateToken, hubspotSyncContact);
router.delete('/hubspot/disconnect', authenticateToken, hubspotDisconnect);
router.get('/hubspot/status', authenticateToken, hubspotStatus);

// Salesforce routes
router.get('/salesforce/connect', authenticateToken, salesforceConnect);
router.get('/salesforce/callback', salesforceCallback);
router.post('/salesforce/sync-contact', authenticateToken, salesforceSyncContact);
router.delete('/salesforce/disconnect', authenticateToken, salesforceDisconnect);
router.get('/salesforce/status', authenticateToken, salesforceStatus);

module.exports = router;
```

---

## 🔵 **PHASE 2 DETAILS: HUBSPOT INTEGRATION**

### **Step 2.1: OAuth Flow**

**How it works:**

```
1. User clicks "Connect HubSpot" in extension
   ↓
2. Extension opens popup: GET /api/integrations/hubspot/connect
   ↓
3. Backend redirects to HubSpot OAuth URL
   ↓
4. User authorizes in HubSpot
   ↓
5. HubSpot redirects to: /api/integrations/hubspot/callback?code=xxx
   ↓
6. Backend exchanges code for tokens
   ↓
7. Backend stores tokens in database
   ↓
8. Backend redirects to success page
   ↓
9. Extension detects success, shows "✓ Connected"
```

---

**New File: `crmsync-backend/src/controllers/hubspotController.js`**

```javascript
const axios = require('axios');
const db = require('../config/database');

// Step 1: Initiate OAuth
exports.hubspotConnect = (req, res) => {
  const userId = req.user.id;
  
  // Store userId in session/state for callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `https://app.hubspot.com/oauth/authorize?` +
    `client_id=${process.env.HUBSPOT_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI)}` +
    `&scope=crm.objects.contacts.write crm.objects.contacts.read` +
    `&state=${state}`;
  
  res.redirect(authUrl);
};

// Step 2: Handle OAuth callback
exports.hubspotCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', {
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
      code: code
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    
    // Get portal ID (account info)
    const accountInfo = await axios.get('https://api.hubapi.com/account-info/v3/api-usage/daily', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const portalId = accountInfo.data.portalId;
    
    // Store in database
    await db.query(`
      INSERT INTO crm_integrations (user_id, platform, access_token, refresh_token, token_expires_at, portal_id)
      VALUES ($1, 'hubspot', $2, $3, $4, $5)
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        access_token = $2,
        refresh_token = $3,
        token_expires_at = $4,
        portal_id = $5,
        is_active = true,
        updated_at = NOW()
    `, [userId, access_token, refresh_token, expiresAt, portalId]);
    
    // Redirect to success page
    res.send(`
      <html>
        <body>
          <h1>✓ HubSpot Connected Successfully!</h1>
          <p>You can close this window now.</p>
          <script>
            window.opener.postMessage({ type: 'HUBSPOT_CONNECTED' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('HubSpot callback error:', error);
    res.status(500).send('Failed to connect HubSpot');
  }
};

// Step 3: Sync contact to HubSpot
exports.hubspotSyncContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contact } = req.body; // { name, email, company, title, phone, etc. }
    
    // Get user's HubSpot tokens
    const integration = await db.query(
      'SELECT * FROM crm_integrations WHERE user_id = $1 AND platform = $2 AND is_active = true',
      [userId, 'hubspot']
    );
    
    if (integration.rows.length === 0) {
      return res.status(400).json({ error: 'HubSpot not connected' });
    }
    
    let accessToken = integration.rows[0].access_token;
    
    // Check if token expired, refresh if needed
    if (new Date(integration.rows[0].token_expires_at) < new Date()) {
      accessToken = await refreshHubSpotToken(userId, integration.rows[0].refresh_token);
    }
    
    // Check for duplicate by email
    const searchResponse = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: contact.email
          }]
        }]
      },
      {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let result;
    if (searchResponse.data.total > 0) {
      // Update existing contact
      const existingContactId = searchResponse.data.results[0].id;
      result = await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${existingContactId}`,
        {
          properties: {
            firstname: contact.firstName || contact.name?.split(' ')[0],
            lastname: contact.lastName || contact.name?.split(' ').slice(1).join(' '),
            email: contact.email,
            company: contact.company,
            jobtitle: contact.title,
            phone: contact.phone
          }
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Log sync
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, contact.id, 'hubspot', 'update', 'success', existingContactId]
      );
      
      return res.json({ 
        success: true, 
        action: 'updated',
        crmContactId: existingContactId,
        url: `https://app.hubspot.com/contacts/${integration.rows[0].portal_id}/contact/${existingContactId}`
      });
    } else {
      // Create new contact
      result = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          properties: {
            firstname: contact.firstName || contact.name?.split(' ')[0],
            lastname: contact.lastName || contact.name?.split(' ').slice(1).join(' '),
            email: contact.email,
            company: contact.company,
            jobtitle: contact.title,
            phone: contact.phone
          }
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const newContactId = result.data.id;
      
      // Log sync
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, contact.id, 'hubspot', 'create', 'success', newContactId]
      );
      
      return res.json({ 
        success: true, 
        action: 'created',
        crmContactId: newContactId,
        url: `https://app.hubspot.com/contacts/${integration.rows[0].portal_id}/contact/${newContactId}`
      });
    }
  } catch (error) {
    console.error('HubSpot sync error:', error.response?.data || error);
    
    // Log error
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, req.body.contact.id, 'hubspot', 'create', 'error', error.message]
    );
    
    res.status(500).json({ error: error.response?.data?.message || 'Failed to sync to HubSpot' });
  }
};

// Helper: Refresh expired token
async function refreshHubSpotToken(userId, refreshToken) {
  const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', {
    grant_type: 'refresh_token',
    client_id: process.env.HUBSPOT_CLIENT_ID,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET,
    refresh_token: refreshToken
  });
  
  const { access_token, refresh_token: newRefreshToken, expires_in } = tokenResponse.data;
  const expiresAt = new Date(Date.now() + expires_in * 1000);
  
  // Update in database
  await db.query(
    'UPDATE crm_integrations SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW() WHERE user_id = $4 AND platform = $5',
    [access_token, newRefreshToken, expiresAt, userId, 'hubspot']
  );
  
  return access_token;
}

// Get connection status
exports.hubspotStatus = async (req, res) => {
  const userId = req.user.id;
  const integration = await db.query(
    'SELECT is_active, portal_id, created_at FROM crm_integrations WHERE user_id = $1 AND platform = $2',
    [userId, 'hubspot']
  );
  
  if (integration.rows.length === 0) {
    return res.json({ connected: false });
  }
  
  res.json({ 
    connected: integration.rows[0].is_active,
    portalId: integration.rows[0].portal_id,
    connectedAt: integration.rows[0].created_at
  });
};

// Disconnect
exports.hubspotDisconnect = async (req, res) => {
  const userId = req.user.id;
  await db.query(
    'UPDATE crm_integrations SET is_active = false WHERE user_id = $1 AND platform = $2',
    [userId, 'hubspot']
  );
  res.json({ success: true });
};
```

---

## 🔴 **PHASE 3 DETAILS: SALESFORCE INTEGRATION**

Very similar to HubSpot, but with Salesforce-specific differences:

**Key Differences:**
1. Salesforce uses `Contact` OR `Lead` objects (you'll need to choose)
2. Instance URL varies per user (stored in token response)
3. Field names are different (`FirstName`, `LastName`, etc.)
4. OAuth flow is slightly different

**New File: `crmsync-backend/src/controllers/salesforceController.js`**

```javascript
const axios = require('axios');
const db = require('../config/database');

// Step 1: Initiate OAuth
exports.salesforceConnect = (req, res) => {
  const userId = req.user.id;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?` +
    `response_type=code` +
    `&client_id=${process.env.SALESFORCE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.SALESFORCE_REDIRECT_URI)}` +
    `&state=${state}`;
  
  res.redirect(authUrl);
};

// Step 2: Handle OAuth callback
exports.salesforceCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI,
        code: code
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token, refresh_token, instance_url } = tokenResponse.data;
    
    // Store in database (Salesforce tokens don't expire, but can be revoked)
    await db.query(`
      INSERT INTO crm_integrations (user_id, platform, access_token, refresh_token, instance_url)
      VALUES ($1, 'salesforce', $2, $3, $4)
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        access_token = $2,
        refresh_token = $3,
        instance_url = $4,
        is_active = true,
        updated_at = NOW()
    `, [userId, access_token, refresh_token, instance_url]);
    
    res.send(`
      <html>
        <body>
          <h1>✓ Salesforce Connected Successfully!</h1>
          <p>You can close this window now.</p>
          <script>
            window.opener.postMessage({ type: 'SALESFORCE_CONNECTED' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Salesforce callback error:', error);
    res.status(500).send('Failed to connect Salesforce');
  }
};

// Step 3: Sync contact to Salesforce (as Lead or Contact)
exports.salesforceSyncContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contact, objectType = 'Lead' } = req.body; // 'Lead' or 'Contact'
    
    // Get user's Salesforce tokens
    const integration = await db.query(
      'SELECT * FROM crm_integrations WHERE user_id = $1 AND platform = $2 AND is_active = true',
      [userId, 'salesforce']
    );
    
    if (integration.rows.length === 0) {
      return res.status(400).json({ error: 'Salesforce not connected' });
    }
    
    const { access_token, instance_url } = integration.rows[0];
    
    // Check for duplicate by email
    const searchQuery = `SELECT Id FROM ${objectType} WHERE Email = '${contact.email}' LIMIT 1`;
    const searchResponse = await axios.get(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    
    let result;
    if (searchResponse.data.totalSize > 0) {
      // Update existing
      const existingId = searchResponse.data.records[0].Id;
      
      const [firstName, ...lastNameParts] = (contact.name || '').split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      result = await axios.patch(
        `${instance_url}/services/data/v57.0/sobjects/${objectType}/${existingId}`,
        {
          FirstName: firstName,
          LastName: lastName,
          Email: contact.email,
          Company: contact.company || 'Unknown',
          Title: contact.title,
          Phone: contact.phone
        },
        {
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Log sync
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, contact.id, 'salesforce', 'update', 'success', existingId]
      );
      
      return res.json({ 
        success: true, 
        action: 'updated',
        crmContactId: existingId,
        url: `${instance_url}/lightning/r/${objectType}/${existingId}/view`
      });
    } else {
      // Create new
      const [firstName, ...lastNameParts] = (contact.name || '').split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      result = await axios.post(
        `${instance_url}/services/data/v57.0/sobjects/${objectType}`,
        {
          FirstName: firstName,
          LastName: lastName,
          Email: contact.email,
          Company: contact.company || 'Unknown',
          Title: contact.title,
          Phone: contact.phone
        },
        {
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const newId = result.data.id;
      
      // Log sync
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, contact.id, 'salesforce', 'create', 'success', newId]
      );
      
      return res.json({ 
        success: true, 
        action: 'created',
        crmContactId: newId,
        url: `${instance_url}/lightning/r/${objectType}/${newId}/view`
      });
    }
  } catch (error) {
    console.error('Salesforce sync error:', error.response?.data || error);
    
    // Log error
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, req.body.contact.id, 'salesforce', 'create', 'error', error.message]
    );
    
    res.status(500).json({ error: error.response?.data?.[0]?.message || 'Failed to sync to Salesforce' });
  }
};

// Get connection status
exports.salesforceStatus = async (req, res) => {
  const userId = req.user.id;
  const integration = await db.query(
    'SELECT is_active, instance_url, created_at FROM crm_integrations WHERE user_id = $1 AND platform = $2',
    [userId, 'salesforce']
  );
  
  if (integration.rows.length === 0) {
    return res.json({ connected: false });
  }
  
  res.json({ 
    connected: integration.rows[0].is_active,
    instanceUrl: integration.rows[0].instance_url,
    connectedAt: integration.rows[0].created_at
  });
};

// Disconnect
exports.salesforceDisconnect = async (req, res) => {
  const userId = req.user.id;
  await db.query(
    'UPDATE crm_integrations SET is_active = false WHERE user_id = $1 AND platform = $2',
    [userId, 'salesforce']
  );
  res.json({ success: true });
};
```

---

## 🎨 **PHASE 4 DETAILS: EXTENSION UI**

### **Step 4.1: Add "Integrations" Tab in Settings**

**Update `popup.html`:**

```html
<!-- Add new tab button -->
<button class="tab-btn" data-tab="integrations">
  <span>🔌 Integrations</span>
</button>

<!-- Add new tab content -->
<div class="tab-content" id="integrations-tab">
  <h3>CRM Integrations</h3>
  
  <!-- HubSpot -->
  <div class="integration-card" id="hubspot-integration">
    <div class="integration-header">
      <img src="https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" alt="HubSpot" class="integration-logo">
      <div>
        <h4>HubSpot</h4>
        <p class="integration-status" id="hubspot-status">Not connected</p>
      </div>
    </div>
    <button class="btn btn-primary" id="hubspot-connect-btn">Connect HubSpot</button>
    <button class="btn btn-danger hidden" id="hubspot-disconnect-btn">Disconnect</button>
  </div>
  
  <!-- Salesforce -->
  <div class="integration-card" id="salesforce-integration">
    <div class="integration-header">
      <img src="https://c1.sfdcstatic.com/content/dam/sfdc-docs/www/logos/logo-salesforce.svg" alt="Salesforce" class="integration-logo">
      <div>
        <h4>Salesforce</h4>
        <p class="integration-status" id="salesforce-status">Not connected</p>
      </div>
    </div>
    <button class="btn btn-primary" id="salesforce-connect-btn">Connect Salesforce</button>
    <button class="btn btn-danger hidden" id="salesforce-disconnect-btn">Disconnect</button>
  </div>
</div>
```

---

### **Step 4.2: Add Integration JavaScript**

**New File: `Saas Tool/integrations.js`**

```javascript
// Integration Manager
class IntegrationManager {
  constructor() {
    this.apiUrl = 'https://crmsync-api.onrender.com/api/integrations';
    this.init();
  }
  
  async init() {
    await this.checkIntegrationStatus();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // HubSpot
    document.getElementById('hubspot-connect-btn')?.addEventListener('click', () => {
      this.connectIntegration('hubspot');
    });
    
    document.getElementById('hubspot-disconnect-btn')?.addEventListener('click', () => {
      this.disconnectIntegration('hubspot');
    });
    
    // Salesforce
    document.getElementById('salesforce-connect-btn')?.addEventListener('click', () => {
      this.connectIntegration('salesforce');
    });
    
    document.getElementById('salesforce-disconnect-btn')?.addEventListener('click', () => {
      this.disconnectIntegration('salesforce');
    });
    
    // Listen for OAuth success messages
    window.addEventListener('message', (event) => {
      if (event.data.type === 'HUBSPOT_CONNECTED') {
        this.handleConnectionSuccess('hubspot');
      } else if (event.data.type === 'SALESFORCE_CONNECTED') {
        this.handleConnectionSuccess('salesforce');
      }
    });
  }
  
  async connectIntegration(platform) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = (screen.width / 2) - (width / 2);
      const top = (screen.height / 2) - (height / 2);
      
      const authWindow = window.open(
        `${this.apiUrl}/${platform}/connect?token=${token}`,
        `Connect ${platform}`,
        `width=${width},height=${height},top=${top},left=${left}`
      );
      
      // Check if popup was blocked
      if (!authWindow) {
        alert('Please allow popups for this site to connect integrations');
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      alert(`Failed to connect ${platform}. Please try again.`);
    }
  }
  
  async disconnectIntegration(platform) {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }
    
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      
      const response = await fetch(`${this.apiUrl}/${platform}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.updateIntegrationUI(platform, false);
        alert(`${platform} disconnected successfully`);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      alert(`Failed to disconnect ${platform}. Please try again.`);
    }
  }
  
  async checkIntegrationStatus() {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      
      // Check HubSpot
      const hubspotResponse = await fetch(`${this.apiUrl}/hubspot/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const hubspotData = await hubspotResponse.json();
      this.updateIntegrationUI('hubspot', hubspotData.connected);
      
      // Check Salesforce
      const salesforceResponse = await fetch(`${this.apiUrl}/salesforce/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const salesforceData = await salesforceResponse.json();
      this.updateIntegrationUI('salesforce', salesforceData.connected);
    } catch (error) {
      console.error('Failed to check integration status:', error);
    }
  }
  
  updateIntegrationUI(platform, connected) {
    const statusEl = document.getElementById(`${platform}-status`);
    const connectBtn = document.getElementById(`${platform}-connect-btn`);
    const disconnectBtn = document.getElementById(`${platform}-disconnect-btn`);
    
    if (connected) {
      statusEl.textContent = '✓ Connected';
      statusEl.style.color = '#10B981';
      connectBtn?.classList.add('hidden');
      disconnectBtn?.classList.remove('hidden');
    } else {
      statusEl.textContent = 'Not connected';
      statusEl.style.color = '#6B7280';
      connectBtn?.classList.remove('hidden');
      disconnectBtn?.classList.add('hidden');
    }
  }
  
  handleConnectionSuccess(platform) {
    this.updateIntegrationUI(platform, true);
    alert(`${platform} connected successfully!`);
  }
  
  // Sync a contact to CRM
  async syncContact(contact, platform) {
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      
      const response = await fetch(`${this.apiUrl}/${platform}/sync-contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contact })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      const result = await response.json();
      
      // Show success notification
      this.showNotification(`✓ Contact ${result.action} in ${platform}`, 'success');
      
      // Open in CRM (optional)
      if (result.url) {
        chrome.tabs.create({ url: result.url, active: false });
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to sync to ${platform}:`, error);
      this.showNotification(`❌ Failed to sync to ${platform}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  showNotification(message, type = 'info') {
    // Use your existing notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize
window.IntegrationManager = new IntegrationManager();
```

---

### **Step 4.3: Add "Push to CRM" Buttons on Contacts**

**Update contact item UI to include CRM buttons:**

```javascript
// In popup.js, update renderContacts() function

function renderContactItem(contact) {
  const contactDiv = document.createElement('div');
  contactDiv.className = 'contact-item';
  
  // ... existing contact HTML ...
  
  // Add CRM sync buttons
  const crmActions = document.createElement('div');
  crmActions.className = 'crm-actions';
  crmActions.innerHTML = `
    <button class="crm-btn hubspot-btn" data-contact-id="${contact.id}" data-platform="hubspot">
      <img src="hubspot-icon.png" width="16"> Push to HubSpot
    </button>
    <button class="crm-btn salesforce-btn" data-contact-id="${contact.id}" data-platform="salesforce">
      <img src="salesforce-icon.png" width="16"> Push to Salesforce
    </button>
  `;
  
  contactDiv.appendChild(crmActions);
  
  // Add click handlers
  crmActions.querySelectorAll('.crm-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const platform = btn.dataset.platform;
      const contactId = btn.dataset.contactId;
      
      // Show loading
      btn.disabled = true;
      btn.textContent = 'Syncing...';
      
      try {
        await window.IntegrationManager.syncContact(contact, platform);
        btn.textContent = '✓ Synced';
        btn.classList.add('synced');
      } catch (error) {
        btn.disabled = false;
        btn.textContent = `Push to ${platform}`;
      }
    });
  });
  
  return contactDiv;
}
```

---

## 📊 **TESTING CHECKLIST**

### **HubSpot Testing:**
- [ ] OAuth flow completes successfully
- [ ] Tokens are stored in database
- [ ] Can create new contact
- [ ] Can update existing contact (duplicate detection)
- [ ] Error handling works
- [ ] Token refresh works
- [ ] Disconnect works
- [ ] UI updates correctly

### **Salesforce Testing:**
- [ ] OAuth flow completes successfully
- [ ] Tokens are stored in database
- [ ] Can create new Lead
- [ ] Can create new Contact
- [ ] Can update existing record
- [ ] Error handling works
- [ ] Disconnect works
- [ ] UI updates correctly

---

## 🚀 **DEPLOYMENT STEPS**

1. **Create developer accounts** (HubSpot + Salesforce)
2. **Run database migrations** (create tables)
3. **Add environment variables** to Render
4. **Deploy backend code** (push to GitHub → Render auto-deploys)
5. **Update extension files** (popup.html, integrations.js)
6. **Test locally** with test accounts
7. **Deploy extension** (upload to Chrome Web Store)
8. **Update website** (announce feature!)

---

## 📈 **SUCCESS METRICS**

Track these after launch:
- Number of users connecting CRMs
- Number of contacts synced per day
- Which CRM is more popular
- Error rates
- Time from install to first sync

---

## 💰 **PRICING STRATEGY**

Consider making integrations a **paid feature:**

**Option 1: Tier-Based**
- Free: CSV export only
- Pro: HubSpot OR Salesforce
- Business: Both + advanced features

**Option 2: Add-On**
- $5/mo per CRM connection

**Option 3: All-Inclusive**
- Pro tier includes all integrations

---

## 🎉 **LAUNCH ANNOUNCEMENT**

Once ready, update website:

```markdown
🚀 NEW: Direct HubSpot & Salesforce Integrations!

No more CSV exports. Push contacts directly to your CRM with one click.

✓ OAuth secure connection
✓ Automatic duplicate detection
✓ Real-time sync
✓ Field mapping included

[Connect Your CRM →]
```

---

## ⏱️ **TIME ESTIMATE**

- **Day 1 (4-6hrs):** Setup accounts, database, environment
- **Day 2 (6-8hrs):** HubSpot integration
- **Day 3 (6-8hrs):** Salesforce integration
- **Day 4 (4-6hrs):** Extension UI
- **Day 5 (4-6hrs):** Testing & polish

**Total: 3-5 days** of focused development

---

## 🛠️ **TOOLS & RESOURCES**

- [HubSpot API Docs](https://developers.hubspot.com/docs/api/overview)
- [Salesforce REST API Docs](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- Postman for API testing

---

## ✅ **READY TO START?**

**Next immediate step:**
1. Create HubSpot developer account
2. Create Salesforce developer account
3. I'll help you set up the first OAuth flow

Let me know when you're ready and I'll guide you through each step! 🚀
