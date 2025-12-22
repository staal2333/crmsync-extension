const axios = require('axios');
const db = require('../config/database');

// =====================================================
// HUBSPOT CONTROLLER
// =====================================================
// Handles all HubSpot integration operations

// Helper: Get user's HubSpot integration
async function getHubSpotIntegration(userId) {
  const result = await db.query(
    'SELECT * FROM crm_integrations WHERE user_id = $1 AND platform = $2 AND is_active = true',
    [userId, 'hubspot']
  );
  
  if (result.rows.length === 0) {
    throw new Error('HubSpot not connected');
  }
  
  return result.rows[0];
}

// Helper: Refresh HubSpot access token
async function refreshHubSpotToken(userId, refreshToken) {
  try {
    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', {
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken
    });
    
    const { access_token, refresh_token: newRefreshToken, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    
    // Update tokens in database
    await db.query(
      'UPDATE crm_integrations SET access_token = $1, refresh_token = $2, token_expires_at = $3 WHERE user_id = $4 AND platform = $5',
      [access_token, newRefreshToken, expiresAt, userId, 'hubspot']
    );
    
    console.log('✅ HubSpot token refreshed for user:', userId);
    return access_token;
  } catch (error) {
    console.error('❌ Failed to refresh HubSpot token:', error.response?.data || error.message);
    throw new Error('Failed to refresh HubSpot token');
  }
}

// Helper: Get valid access token (refresh if expired)
async function getValidAccessToken(userId, integration) {
  let accessToken = integration.access_token;
  
  // Check if token is expired or about to expire (within 5 minutes)
  if (integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiresAt < fiveMinutesFromNow) {
      console.log('🔄 HubSpot token expired or expiring soon, refreshing...');
      accessToken = await refreshHubSpotToken(userId, integration.refresh_token);
    }
  }
  
  return accessToken;
}

// =====================================================
// OAUTH FLOW
// =====================================================

// Step 1: Initiate OAuth flow
exports.hubspotConnect = (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Encode userId in state for callback
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    
    const authUrl = `https://app.hubspot.com/oauth/authorize?` +
      `client_id=${process.env.HUBSPOT_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI)}` +
      `&scope=crm.objects.contacts.write crm.objects.contacts.read` +
      `&state=${state}`;
    
    console.log('🔵 Starting HubSpot OAuth for user:', userId);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ HubSpot connect error:', error);
    res.status(500).send('Failed to initiate HubSpot connection');
  }
};

// Step 2: Handle OAuth callback
exports.hubspotCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }
    
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    console.log('🔵 HubSpot OAuth callback for user:', userId);
    
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
        code: code
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    
    // Get HubSpot account info
    const accountInfo = await axios.get('https://api.hubapi.com/account-info/v3/details', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const accountId = String(accountInfo.data.portalId);
    const accountName = accountInfo.data.name || 'HubSpot Account';
    
    // Store tokens in database
    await db.query(`
      INSERT INTO crm_integrations (user_id, platform, access_token, refresh_token, token_expires_at, account_id, account_name, metadata)
      VALUES ($1, 'hubspot', $2, $3, $4, $5, $6, '{}')
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        access_token = $2,
        refresh_token = $3,
        token_expires_at = $4,
        account_id = $5,
        account_name = $6,
        is_active = true
    `, [userId, access_token, refresh_token, expiresAt, accountId, accountName]);
    
    console.log('✅ HubSpot connected successfully for user:', userId, 'Account ID:', accountId);
    
    // Return success page that closes the popup
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HubSpot Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 { font-size: 48px; margin: 0 0 20px 0; }
            p { font-size: 18px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ HubSpot Connected!</h1>
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ HubSpot callback error:', error.response?.data || error.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
            }
            h1 { font-size: 48px; margin: 0 0 20px 0; }
            p { font-size: 16px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Connection Failed</h1>
            <p>Failed to connect HubSpot. Please try again.</p>
            <p style="font-size: 14px; margin-top: 20px;">${error.message}</p>
          </div>
          <script>
            setTimeout(() => window.close(), 5000);
          </script>
        </body>
      </html>
    `);
  }
};

// =====================================================
// SYNC OPERATIONS
// =====================================================

// Sync single contact to HubSpot
exports.hubspotSyncContact = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contact } = req.body;
    
    if (!contact || !contact.email) {
      return res.status(400).json({ error: 'Contact email is required' });
    }
    
    console.log('🔵 Syncing contact to HubSpot:', contact.email);
    
    // Get user's HubSpot integration
    const integration = await getHubSpotIntegration(userId);
    const accessToken = await getValidAccessToken(userId, integration);
    
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
        }],
        limit: 1
      },
      {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Prepare contact properties
    const [firstName, ...lastNameParts] = (contact.name || '').split(' ');
    const contactProperties = {
      email: contact.email,
      firstname: firstName || '',
      lastname: lastNameParts.join(' ') || '',
      company: contact.company || '',
      jobtitle: contact.title || '',
      phone: contact.phone || ''
    };
    
    let result;
    let action;
    let crmContactId;
    
    if (searchResponse.data.total > 0) {
      // Update existing contact
      crmContactId = searchResponse.data.results[0].id;
      
      await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${crmContactId}`,
        { properties: contactProperties },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      action = 'update';
      console.log('✅ Updated existing HubSpot contact:', crmContactId);
    } else {
      // Create new contact
      const createResponse = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        { properties: contactProperties },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      crmContactId = createResponse.data.id;
      action = 'create';
      console.log('✅ Created new HubSpot contact:', crmContactId);
    }
    
    // Create/update mapping
    if (contact.id) {
      await db.query(`
        INSERT INTO crm_contact_mappings (user_id, contact_id, platform, crm_contact_id, sync_direction, last_synced)
        VALUES ($1, $2, 'hubspot', $3, 'push', NOW())
        ON CONFLICT (user_id, contact_id, platform) 
        DO UPDATE SET 
          crm_contact_id = $3,
          last_synced = NOW()
      `, [userId, contact.id, crmContactId]);
    }
    
    // Log sync operation
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, contact.id, 'hubspot', action, 'success', crmContactId]
    );
    
    // Return success with CRM URL
    res.json({ 
      success: true, 
      action: action,
      crmContactId: crmContactId,
      url: `https://app.hubspot.com/contacts/${integration.portal_id}/contact/${crmContactId}`
    });
  } catch (error) {
    console.error('❌ HubSpot sync error:', error.response?.data || error.message);
    
    // Log error
    if (req.body.contact?.id) {
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.userId, req.body.contact.id, 'hubspot', 'create', 'error', error.message]
      );
    }
    
    res.status(500).json({ 
      error: error.response?.data?.message || error.message || 'Failed to sync to HubSpot' 
    });
  }
};

// Sync ALL contacts from HubSpot (pull and create mappings)
exports.hubspotSyncAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔵 Starting full HubSpot sync for user:', userId);
    
    // Get user's HubSpot integration
    const integration = await getHubSpotIntegration(userId);
    const accessToken = await getValidAccessToken(userId, integration);
    
    // Fetch ALL contacts from HubSpot (handle pagination)
    let allCrmContacts = [];
    let after = undefined;
    let hasMore = true;
    
    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&after=${after}&properties=email,firstname,lastname`
        : 'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      allCrmContacts = [...allCrmContacts, ...response.data.results];
      
      after = response.data.paging?.next?.after;
      hasMore = !!after;
      
      console.log(`📊 Fetched ${response.data.results.length} contacts (total: ${allCrmContacts.length})`);
    }
    
    console.log(`✅ Fetched ${allCrmContacts.length} total contacts from HubSpot`);
    
    // Get all user's contacts from our database
    const ourContacts = await db.query(
      'SELECT id, email FROM contacts WHERE user_id = $1',
      [userId]
    );
    
    // Create a map for quick lookup
    const contactEmailMap = new Map();
    ourContacts.rows.forEach(contact => {
      if (contact.email) {
        contactEmailMap.set(contact.email.toLowerCase(), contact.id);
      }
    });
    
    // Match CRM contacts with our contacts and create/update them
    let mappedCount = 0;
    let importedCount = 0;
    
    for (const crmContact of allCrmContacts) {
      const email = crmContact.properties.email;
      if (!email) continue;
      
      let ourContactId = contactEmailMap.get(email.toLowerCase());
      
      // If contact doesn't exist in our database, create it
      if (!ourContactId) {
        try {
          const insertResult = await db.query(`
            INSERT INTO contacts (
              user_id, 
              email, 
              first_name, 
              last_name,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id
          `, [
            userId, 
            email,
            crmContact.properties.firstname || '',
            crmContact.properties.lastname || ''
          ]);
          
          ourContactId = insertResult.rows[0].id;
          importedCount++;
          console.log(`📥 Imported contact: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to import contact ${email}:`, error.message);
          continue;
        }
      }
      
      // Create mapping
      await db.query(`
        INSERT INTO crm_contact_mappings (user_id, contact_id, platform, crm_contact_id, sync_direction, last_synced)
        VALUES ($1, $2, 'hubspot', $3, 'pull', NOW())
        ON CONFLICT (user_id, contact_id, platform) 
        DO UPDATE SET 
          crm_contact_id = $3,
          sync_direction = 'pull',
          last_synced = NOW()
      `, [userId, ourContactId, crmContact.id]);
      
      mappedCount++;
    }
    
    // Log sync operation
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, platform, action, status, metadata) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'hubspot', 'sync_all', 'success', JSON.stringify({ 
        total_crm_contacts: allCrmContacts.length,
        imported_contacts: importedCount,
        mapped_contacts: mappedCount 
      })]
    );
    
    console.log(`✅ Sync complete: Imported ${importedCount} new contacts, mapped ${mappedCount} total contacts from ${allCrmContacts.length} HubSpot contacts`);
    
    res.json({ 
      success: true,
      totalCrmContacts: allCrmContacts.length,
      importedContacts: importedCount,
      mappedContacts: mappedCount,
      message: `Successfully imported ${importedCount} contacts and synced ${mappedCount} total contacts from HubSpot`
    });
  } catch (error) {
    console.error('❌ HubSpot sync all error:', error.response?.data || error.message);
    
    // Log error
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'hubspot', 'sync_all', 'error', error.message]
    );
    
    res.status(500).json({ 
      error: error.response?.data?.message || error.message || 'Failed to sync from HubSpot' 
    });
  }
};

// =====================================================
// STATUS & MANAGEMENT
// =====================================================

// Get HubSpot connection status
exports.hubspotStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const integration = await db.query(
      'SELECT is_active, account_id, account_name, connected_at, last_synced_at FROM crm_integrations WHERE user_id = $1 AND platform = $2',
      [userId, 'hubspot']
    );
    
    if (integration.rows.length === 0) {
      return res.json({ connected: false });
    }
    
    // Get last sync time
    const lastSync = await db.query(
      'SELECT MAX(synced_at) as last_sync FROM crm_sync_logs WHERE user_id = $1 AND platform = $2 AND action = $3 AND status = $4',
      [userId, 'hubspot', 'sync_all', 'success']
    );
    
    // Get mapping count
    const mappingCount = await db.query(
      'SELECT COUNT(*) as count FROM crm_contact_mappings WHERE user_id = $1 AND platform = $2',
      [userId, 'hubspot']
    );
    
    res.json({ 
      connected: integration.rows[0].is_active,
      accountId: integration.rows[0].account_id,
      accountName: integration.rows[0].account_name,
      connectedAt: integration.rows[0].connected_at,
      lastSync: lastSync.rows[0]?.last_sync || integration.rows[0].last_synced_at || null,
      syncedContactsCount: parseInt(mappingCount.rows[0]?.count || 0)
    });
  } catch (error) {
    console.error('❌ HubSpot status error:', error.message);
    res.status(500).json({ error: 'Failed to get HubSpot status' });
  }
};

// Disconnect HubSpot integration
exports.hubspotDisconnect = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await db.query(
      'UPDATE crm_integrations SET is_active = false WHERE user_id = $1 AND platform = $2',
      [userId, 'hubspot']
    );
    
    console.log('🔵 HubSpot disconnected for user:', userId);
    
    res.json({ success: true, message: 'HubSpot disconnected successfully' });
  } catch (error) {
    console.error('❌ HubSpot disconnect error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect HubSpot' });
  }
};
