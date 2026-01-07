const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/database');

// =====================================================
// SALESFORCE CONTROLLER
// =====================================================
// Handles all Salesforce integration operations

// Helper: Get user's Salesforce integration
async function getSalesforceIntegration(userId) {
  const result = await db.query(
    'SELECT * FROM crm_integrations WHERE user_id = $1 AND platform = $2 AND is_active = true',
    [userId, 'salesforce']
  );
  
  if (result.rows.length === 0) {
    throw new Error('Salesforce not connected');
  }
  
  return result.rows[0];
}

// =====================================================
// OAUTH FLOW
// =====================================================

// Step 1: Initiate OAuth flow
exports.salesforceConnect = (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Encode userId and codeVerifier in state for callback
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      codeVerifier,
      timestamp: Date.now() 
    })).toString('base64');
    
    const authUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?` +
      `response_type=code` +
      `&client_id=${process.env.SALESFORCE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.SALESFORCE_REDIRECT_URI)}` +
      `&scope=api refresh_token offline_access` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256` +
      `&state=${state}`;
    
    console.log('🔴 Starting Salesforce OAuth for user:', userId);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Salesforce connect error:', error);
    res.status(500).send('Failed to initiate Salesforce connection');
  }
};

// Step 2: Handle OAuth callback
exports.salesforceCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }
    
    // Decode state to get userId and codeVerifier
    const { userId, codeVerifier } = JSON.parse(Buffer.from(state, 'base64').toString());
    
    console.log('🔴 Salesforce OAuth callback for user:', userId);
    
    // Exchange authorization code for tokens (with PKCE)
    const tokenResponse = await axios.post(
      `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI,
        code: code,
        code_verifier: codeVerifier
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token, refresh_token, instance_url } = tokenResponse.data;
    
    // Store tokens in database (Salesforce tokens don't expire by default)
    await db.query(`
      INSERT INTO crm_integrations (user_id, platform, access_token, refresh_token, instance_url, metadata)
      VALUES ($1, 'salesforce', $2, $3, $4, '{}')
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        access_token = $2,
        refresh_token = $3,
        instance_url = $4,
        is_active = true
    `, [userId, access_token, refresh_token, instance_url]);
    
    console.log('✅ Salesforce connected successfully for user:', userId, 'Instance:', instance_url);
    
    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://crm-sync.net';
    res.redirect(`${frontendUrl}/#/connect-crm?success=true&platform=salesforce`);
  } catch (error) {
    console.error('❌ Salesforce callback error:', error.response?.data || error.message);
    
    // Redirect back to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'https://crm-sync.net';
    res.redirect(`${frontendUrl}/#/connect-crm?error=${encodeURIComponent(error.message || 'Connection failed')}`);
  }
};

// =====================================================
// SYNC OPERATIONS
// =====================================================

// Sync single contact to Salesforce
exports.salesforceSyncContact = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contact, objectType = 'Lead' } = req.body; // 'Lead' or 'Contact'
    
    if (!contact || !contact.email) {
      return res.status(400).json({ error: 'Contact email is required' });
    }
    
    console.log('🔴 Syncing contact to Salesforce:', contact.email, 'as', objectType);
    
    // Get user's Salesforce integration
    const integration = await getSalesforceIntegration(userId);
    const { access_token, instance_url } = integration;
    
    // Check for duplicate by email
    const searchQuery = `SELECT Id FROM ${objectType} WHERE Email = '${contact.email.replace(/'/g, "\\'")}' LIMIT 1`;
    const searchResponse = await axios.get(
      `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    
    // Prepare contact data
    const [firstName, ...lastNameParts] = (contact.name || '').split(' ');
    const contactData = {
      FirstName: firstName || '',
      LastName: lastNameParts.join(' ') || firstName || 'Unknown',
      Email: contact.email,
      Company: contact.company || 'Unknown',
      Title: contact.title || '',
      Phone: contact.phone || ''
    };
    
    let result;
    let action;
    let crmContactId;
    
    if (searchResponse.data.totalSize > 0) {
      // Update existing record
      crmContactId = searchResponse.data.records[0].Id;
      
      await axios.patch(
        `${instance_url}/services/data/v57.0/sobjects/${objectType}/${crmContactId}`,
        contactData,
        {
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      action = 'update';
      console.log('✅ Updated existing Salesforce', objectType, ':', crmContactId);
    } else {
      // Create new record
      const createResponse = await axios.post(
        `${instance_url}/services/data/v57.0/sobjects/${objectType}`,
        contactData,
        {
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      crmContactId = createResponse.data.id;
      action = 'create';
      console.log('✅ Created new Salesforce', objectType, ':', crmContactId);
    }
    
    // Create/update mapping
    if (contact.id) {
      await db.query(`
        INSERT INTO crm_contact_mappings (user_id, contact_id, platform, crm_contact_id, crm_record_type, sync_direction, last_synced)
        VALUES ($1, $2, 'salesforce', $3, $4, 'push', NOW())
        ON CONFLICT (user_id, contact_id, platform) 
        DO UPDATE SET 
          crm_contact_id = $3,
          crm_record_type = $4,
          last_synced = NOW()
      `, [userId, contact.id, crmContactId, objectType]);
    }
    
    // Log sync operation
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, crm_contact_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, contact.id, 'salesforce', action, 'success', crmContactId, JSON.stringify({ objectType })]
    );
    
    // Return success with CRM URL
    res.json({ 
      success: true, 
      action: action,
      crmContactId: crmContactId,
      objectType: objectType,
      url: `${instance_url}/lightning/r/${objectType}/${crmContactId}/view`
    });
  } catch (error) {
    console.error('❌ Salesforce sync error:', error.response?.data || error.message);
    
    // Log error
    if (req.body.contact?.id) {
      await db.query(
        'INSERT INTO crm_sync_logs (user_id, contact_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.userId, req.body.contact.id, 'salesforce', 'create', 'error', error.message]
      );
    }
    
    res.status(500).json({ 
      error: error.response?.data?.[0]?.message || error.message || 'Failed to sync to Salesforce' 
    });
  }
};

// Sync ALL contacts from Salesforce (pull and create mappings)
exports.salesforceSyncAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { objectTypes = ['Contact', 'Lead'] } = req.body; // Sync both Contacts and Leads by default
    
    console.log('🔴 Starting full Salesforce sync for user:', userId);
    
    // Get user's Salesforce integration
    const integration = await getSalesforceIntegration(userId);
    const { access_token, instance_url } = integration;
    
    let allCrmContacts = [];
    
    // Fetch contacts from each object type
    for (const objectType of objectTypes) {
      console.log(`📊 Fetching ${objectType}s from Salesforce...`);
      
      // SOQL query to get all records with email
      const query = `SELECT Id, Email, FirstName, LastName FROM ${objectType} WHERE Email != null`;
      const queryResponse = await axios.get(
        `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${access_token}` }
        }
      );
      
      const records = queryResponse.data.records.map(record => ({
        ...record,
        objectType: objectType
      }));
      
      allCrmContacts = [...allCrmContacts, ...records];
      console.log(`✅ Fetched ${records.length} ${objectType}s from Salesforce`);
    }
    
    console.log(`✅ Fetched ${allCrmContacts.length} total records from Salesforce`);
    
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
      const email = crmContact.Email;
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
              source,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id
          `, [
            userId, 
            email,
            crmContact.FirstName || '',
            crmContact.LastName || '',
            'salesforce'
          ]);
          
          ourContactId = insertResult.rows[0].id;
          importedCount++;
          console.log(`📥 Imported contact from Salesforce: ${email}`);
        } catch (error) {
          console.error(`❌ Failed to import contact ${email}:`, error.message);
          continue;
        }
      }
      
      // Create mapping
      await db.query(`
        INSERT INTO crm_contact_mappings (user_id, contact_id, platform, crm_contact_id, crm_record_type, last_synced)
        VALUES ($1, $2, 'salesforce', $3, $4, NOW())
        ON CONFLICT (contact_id, platform) 
        DO UPDATE SET 
          crm_contact_id = $3,
          crm_record_type = $4,
          last_synced = NOW()
      `, [userId, ourContactId, crmContact.Id, crmContact.objectType]);
      
      mappedCount++;
    }
    
    // Log sync operation
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, platform, action, status, metadata) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'salesforce', 'sync_all', 'success', JSON.stringify({ 
        total_crm_contacts: allCrmContacts.length,
        imported_contacts: importedCount,
        mapped_contacts: mappedCount,
        object_types: objectTypes
      })]
    );
    
    console.log(`✅ Sync complete: Imported ${importedCount} new contacts, mapped ${mappedCount} total contacts from ${allCrmContacts.length} Salesforce records`);
    
    res.json({ 
      success: true,
      totalCrmContacts: allCrmContacts.length,
      importedContacts: importedCount,
      mappedContacts: mappedCount,
      message: `Successfully imported ${importedCount} contacts and synced ${mappedCount} total contacts from Salesforce`
    });
  } catch (error) {
    console.error('❌ Salesforce sync all error:', error.response?.data || error.message);
    
    // Log error
    await db.query(
      'INSERT INTO crm_sync_logs (user_id, platform, action, status, error_message) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, 'salesforce', 'sync_all', 'error', error.message]
    );
    
    res.status(500).json({ 
      error: error.response?.data?.[0]?.message || error.message || 'Failed to sync from Salesforce' 
    });
  }
};

// =====================================================
// STATUS & MANAGEMENT
// =====================================================

// Get Salesforce connection status
exports.salesforceStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const integration = await db.query(
      'SELECT is_active, instance_url, account_name, account_id, connected_at, last_synced_at FROM crm_integrations WHERE user_id = $1 AND platform = $2',
      [userId, 'salesforce']
    );
    
    if (integration.rows.length === 0) {
      return res.json({ connected: false });
    }
    
    // Get last sync time
    const lastSync = await db.query(
      'SELECT MAX(synced_at) as last_sync FROM crm_sync_logs WHERE user_id = $1 AND platform = $2 AND action = $3 AND status = $4',
      [userId, 'salesforce', 'sync_all', 'success']
    );
    
    // Get mapping count
    const mappingCount = await db.query(
      'SELECT COUNT(*) as count FROM crm_contact_mappings WHERE user_id = $1 AND platform = $2',
      [userId, 'salesforce']
    );
    
    res.json({ 
      connected: integration.rows[0].is_active,
      instanceUrl: integration.rows[0].instance_url,
      accountName: integration.rows[0].account_name,
      accountId: integration.rows[0].account_id,
      connectedAt: integration.rows[0].connected_at,
      lastSync: lastSync.rows[0]?.last_sync || integration.rows[0].last_synced_at || null,
      syncedContactsCount: parseInt(mappingCount.rows[0]?.count || 0)
    });
  } catch (error) {
    console.error('❌ Salesforce status error:', error.message);
    res.status(500).json({ error: 'Failed to get Salesforce status' });
  }
};

// Check for duplicate contacts in Salesforce
exports.salesforceCheckDuplicate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get integration
    const integration = await getSalesforceIntegration(userId);
    
    // Search for contact by email in Salesforce (check both Leads and Contacts)
    const query = `SELECT Id, Email, FirstName, LastName, Company, Title, Phone FROM Lead WHERE Email = '${email}' LIMIT 1`;
    const contactQuery = `SELECT Id, Email, FirstName, LastName, Account.Name, Title, Phone FROM Contact WHERE Email = '${email}' LIMIT 1`;
    
    let duplicate = null;
    let objectType = null;
    
    try {
      // Check Leads first
      const leadResponse = await axios.get(
        `${integration.instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (leadResponse.data.records && leadResponse.data.records.length > 0) {
        duplicate = leadResponse.data.records[0];
        objectType = 'Lead';
      }
    } catch (error) {
      console.log('No lead found, checking contacts...');
    }
    
    // If no lead found, check Contacts
    if (!duplicate) {
      try {
        const contactResponse = await axios.get(
          `${integration.instance_url}/services/data/v57.0/query?q=${encodeURIComponent(contactQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (contactResponse.data.records && contactResponse.data.records.length > 0) {
          duplicate = contactResponse.data.records[0];
          objectType = 'Contact';
        }
      } catch (error) {
        console.log('No contact found');
      }
    }
    
    if (duplicate) {
      console.log(`🔍 Duplicate found in Salesforce (${objectType}) for ${email}`);
      res.json({
        isDuplicate: true,
        objectType,
        contact: {
          id: duplicate.Id,
          email: duplicate.Email,
          firstName: duplicate.FirstName,
          lastName: duplicate.LastName,
          company: duplicate.Company || duplicate.Account?.Name,
          title: duplicate.Title,
          phone: duplicate.Phone
        }
      });
    } else {
      console.log(`✅ No duplicate found in Salesforce for ${email}`);
      res.json({ isDuplicate: false });
    }
  } catch (error) {
    console.error('❌ Salesforce duplicate check error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
};

// Disconnect Salesforce integration
exports.salesforceDisconnect = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await db.query(
      'UPDATE crm_integrations SET is_active = false WHERE user_id = $1 AND platform = $2',
      [userId, 'salesforce']
    );
    
    console.log('🔴 Salesforce disconnected for user:', userId);
    
    res.json({ success: true, message: 'Salesforce disconnected successfully' });
  } catch (error) {
    console.error('❌ Salesforce disconnect error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect Salesforce' });
  }
};
