/**
 * Inbox Sync Service - Orchestrates full inbox scanning and CRM syncing
 */

const gmailService = require('./gmailService');
const hubspotService = require('./hubspotService');
const salesforceService = require('./salesforceService');
const db = require('../config/database');

class InboxSyncService {
  constructor() {
    this.activeSyncs = new Map(); // Track active sync sessions
  }

  /**
   * Start full inbox sync
   * @param {string} userId - User ID
   * @param {Object} options - Sync options
   * @param {Function} progressCallback - Progress callback
   * @returns {Object} Sync session
   */
  async startInboxSync(userId, options = {}, progressCallback = null) {
    const {
      dateRange = '90d',
      updateExisting = true,
      createNew = true,
      platforms = ['hubspot', 'salesforce'], // Which CRMs to sync to
      maxEmails = 5000
    } = options;

    console.log(`🚀 Starting inbox sync for user ${userId}`, { dateRange, platforms, maxEmails });

    // Create sync session
    const syncId = `sync_${userId}_${Date.now()}`;
    const syncSession = {
      id: syncId,
      userId,
      status: 'running',
      startedAt: new Date(),
      progress: {
        phase: 'initializing',
        emailsScanned: 0,
        totalEmails: 0,
        contactsFound: 0,
        contactsUpdated: 0,
        contactsCreated: 0,
        errors: []
      },
      options
    };

    this.activeSyncs.set(syncId, syncSession);

    try {
      // Phase 1: Get user's Gmail OAuth token
      this.updateProgress(syncSession, { phase: 'fetching_gmail_token' }, progressCallback);
      
      const gmailToken = await this.getGmailToken(userId);
      if (!gmailToken) {
        throw new Error('Gmail not connected. Please sign in with Google on the website first: Settings → Connect Gmail');
      }

      // Phase 2: Fetch all message IDs
      this.updateProgress(syncSession, { phase: 'fetching_message_ids' }, progressCallback);
      
      const messageIds = await gmailService.fetchAllMessageIds(gmailToken, {
        dateRange,
        maxResults: maxEmails
      });

      syncSession.progress.totalEmails = messageIds.length;
      this.updateProgress(syncSession, {}, progressCallback);

      // Phase 3: Fetch email metadata in batches
      this.updateProgress(syncSession, { phase: 'fetching_emails' }, progressCallback);
      
      const emails = await gmailService.fetchEmailBatch(
        gmailToken,
        messageIds,
        (batchProgress) => {
          syncSession.progress.emailsScanned = batchProgress.processed;
          this.updateProgress(syncSession, {}, progressCallback);
        }
      );

      // Phase 4: Extract contacts from emails
      this.updateProgress(syncSession, { phase: 'extracting_contacts' }, progressCallback);
      
      const contacts = gmailService.extractContactsFromEmails(emails);
      syncSession.progress.contactsFound = contacts.length;
      this.updateProgress(syncSession, {}, progressCallback);

      // Phase 5: Sync contacts to CRM(s)
      this.updateProgress(syncSession, { phase: 'syncing_to_crm' }, progressCallback);
      
      const syncResults = await this.syncContactsToCRM(
        userId,
        contacts,
        platforms,
        { updateExisting, createNew },
        (crmProgress) => {
          syncSession.progress.contactsUpdated = crmProgress.updated;
          syncSession.progress.contactsCreated = crmProgress.created;
          this.updateProgress(syncSession, {}, progressCallback);
        }
      );

      // Phase 6: Complete
      syncSession.status = 'completed';
      syncSession.completedAt = new Date();
      syncSession.results = syncResults;
      this.updateProgress(syncSession, { phase: 'completed' }, progressCallback);

      console.log('✅ Inbox sync completed:', syncResults);

      // Save sync history to database
      await this.saveSyncHistory(syncSession);

      return syncSession;

    } catch (error) {
      console.error('❌ Inbox sync failed:', error);
      
      syncSession.status = 'failed';
      syncSession.error = error.message;
      syncSession.completedAt = new Date();
      this.updateProgress(syncSession, { phase: 'failed' }, progressCallback);

      throw error;
    }
  }

  /**
   * Sync contacts to CRM platforms
   */
  async syncContactsToCRM(userId, contacts, platforms, options, progressCallback) {
    const { updateExisting, createNew } = options;
    const results = {
      updated: 0,
      created: 0,
      skipped: 0,
      errors: []
    };

    console.log(`📤 Syncing ${contacts.length} contacts to ${platforms.join(', ')}...`);

    // Get CRM integrations
    const integrations = await this.getCRMIntegrations(userId, platforms);

    for (const contact of contacts) {
      try {
        // Skip invalid emails
        if (!gmailService.isValidEmail(contact.email)) {
          results.skipped++;
          continue;
        }

        // Sync to each platform
        for (const integration of integrations) {
          try {
            if (integration.platform === 'hubspot') {
              const result = await this.syncToHubSpot(
                integration.accessToken,
                contact,
                { updateExisting, createNew }
              );
              
              if (result.created) results.created++;
              if (result.updated) results.updated++;
              
            } else if (integration.platform === 'salesforce') {
              const result = await this.syncToSalesforce(
                integration.accessToken,
                integration.instanceUrl,
                contact,
                { updateExisting, createNew }
              );
              
              if (result.created) results.created++;
              if (result.updated) results.updated++;
            }
          } catch (crmError) {
            console.error(`⚠️ Failed to sync ${contact.email} to ${integration.platform}:`, crmError.message);
            results.errors.push({
              contact: contact.email,
              platform: integration.platform,
              error: crmError.message
            });
          }
        }

        // Progress callback
        if (progressCallback) {
          progressCallback(results);
        }

      } catch (error) {
        console.error(`⚠️ Error processing contact ${contact.email}:`, error.message);
        results.errors.push({
          contact: contact.email,
          error: error.message
        });
      }
    }

    console.log('📊 Sync results:', results);
    return results;
  }

  /**
   * Sync contact to HubSpot
   */
  async syncToHubSpot(accessToken, contact, options) {
    const { updateExisting, createNew } = options;
    
    // Check if contact exists
    const existing = await hubspotService.findContactByEmail(accessToken, contact.email);

    if (existing) {
      if (updateExisting) {
        // Update existing contact
        await hubspotService.updateContact(accessToken, existing.id, {
          firstname: contact.name ? contact.name.split(' ')[0] : undefined,
          lastname: contact.name ? contact.name.split(' ').slice(1).join(' ') : undefined,
          last_contact_date: contact.lastContactDate ? contact.lastContactDate.toISOString().split('T')[0] : undefined
        });
        
        return { updated: true, created: false };
      }
      
      return { updated: false, created: false };
    } else {
      if (createNew) {
        // Create new contact
        await hubspotService.createContact(accessToken, {
          email: contact.email,
          firstname: contact.name ? contact.name.split(' ')[0] : undefined,
          lastname: contact.name ? contact.name.split(' ').slice(1).join(' ') : undefined,
          last_contact_date: contact.lastContactDate ? contact.lastContactDate.toISOString().split('T')[0] : undefined
        });
        
        return { updated: false, created: true };
      }
      
      return { updated: false, created: false };
    }
  }

  /**
   * Sync contact to Salesforce
   */
  async syncToSalesforce(accessToken, instanceUrl, contact, options) {
    const { updateExisting, createNew } = options;
    
    // Check if contact exists
    const existing = await salesforceService.findContactByEmail(accessToken, instanceUrl, contact.email);

    if (existing) {
      if (updateExisting) {
        // Update existing contact
        const nameParts = contact.name ? contact.name.split(' ') : [];
        await salesforceService.updateContact(accessToken, instanceUrl, existing.Id, {
          FirstName: nameParts[0] || undefined,
          LastName: nameParts.slice(1).join(' ') || undefined,
          LastActivityDate: contact.lastContactDate ? contact.lastContactDate.toISOString().split('T')[0] : undefined
        });
        
        return { updated: true, created: false };
      }
      
      return { updated: false, created: false };
    } else {
      if (createNew) {
        // Create new contact
        const nameParts = contact.name ? contact.name.split(' ') : ['', ''];
        await salesforceService.createContact(accessToken, instanceUrl, {
          Email: contact.email,
          FirstName: nameParts[0] || 'Unknown',
          LastName: nameParts.slice(1).join(' ') || 'Contact'
        });
        
        return { updated: false, created: true };
      }
      
      return { updated: false, created: false };
    }
  }

  /**
   * Get Gmail OAuth token for user
   */
  async getGmailToken(userId) {
    // Gmail tokens are stored in the database or retrieved via OAuth
    // For now, we assume user's Gmail is connected via Google OAuth
    const result = await db.query(
      'SELECT google_access_token FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].google_access_token) {
      return null;
    }

    return result.rows[0].google_access_token;
  }

  /**
   * Get CRM integrations for user
   */
  async getCRMIntegrations(userId, platforms) {
    const result = await db.query(
      `SELECT platform, access_token, instance_url, refresh_token 
       FROM crm_integrations 
       WHERE user_id = $1 AND platform = ANY($2) AND active = true`,
      [userId, platforms]
    );

    return result.rows;
  }

  /**
   * Update sync progress
   */
  updateProgress(syncSession, updates, progressCallback) {
    Object.assign(syncSession.progress, updates);
    
    if (progressCallback) {
      progressCallback(syncSession);
    }
  }

  /**
   * Get sync session status
   */
  getSyncSession(syncId) {
    return this.activeSyncs.get(syncId);
  }

  /**
   * Save sync history to database
   */
  async saveSyncHistory(syncSession) {
    try {
      await db.query(
        `INSERT INTO inbox_sync_history 
         (user_id, started_at, completed_at, status, emails_scanned, contacts_found, contacts_updated, contacts_created, options, results)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          syncSession.userId,
          syncSession.startedAt,
          syncSession.completedAt,
          syncSession.status,
          syncSession.progress.emailsScanned,
          syncSession.progress.contactsFound,
          syncSession.progress.contactsUpdated,
          syncSession.progress.contactsCreated,
          JSON.stringify(syncSession.options),
          JSON.stringify(syncSession.results)
        ]
      );
    } catch (error) {
      console.error('⚠️ Failed to save sync history:', error);
    }
  }
}

module.exports = new InboxSyncService();
