/**
 * Gmail Service - Handles Gmail API operations for inbox scanning
 */

const { google } = require('googleapis');

class GmailService {
  /**
   * Create Gmail API client from user's OAuth tokens
   */
  createGmailClient(accessToken) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Fetch all email message IDs from inbox
   * @param {string} accessToken - Gmail OAuth access token
   * @param {Object} options - Scan options
   * @returns {Array} Array of message IDs
   */
  async fetchAllMessageIds(accessToken, options = {}) {
    const gmail = this.createGmailClient(accessToken);
    const {
      dateRange = '30d', // '30d', '90d', 'all'
      maxResults = 5000
    } = options;

    let query = 'in:inbox OR in:sent';
    
    // Add date filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '/');
        query += ` after:${dateStr}`;
      }
    }

    console.log('📬 Gmail query:', query);

    const messageIds = [];
    let pageToken = null;

    try {
      do {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 500, // Max per page
          pageToken: pageToken
        });

        if (response.data.messages) {
          messageIds.push(...response.data.messages.map(m => m.id));
          console.log(`📨 Fetched ${messageIds.length} message IDs so far...`);
        }

        pageToken = response.data.nextPageToken;

        // Safety limit
        if (messageIds.length >= maxResults) {
          console.log(`⚠️ Reached max results limit: ${maxResults}`);
          break;
        }
      } while (pageToken);

      console.log(`✅ Total message IDs fetched: ${messageIds.length}`);
      return messageIds;

    } catch (error) {
      console.error('❌ Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch Gmail messages: ' + error.message);
    }
  }

  /**
   * Fetch email details in batch
   * @param {string} accessToken - Gmail OAuth access token
   * @param {Array} messageIds - Array of message IDs to fetch
   * @param {Function} onProgress - Progress callback
   * @returns {Array} Array of email data
   */
  async fetchEmailBatch(accessToken, messageIds, onProgress = null) {
    const gmail = this.createGmailClient(accessToken);
    const emails = [];
    const batchSize = 100; // Process 100 at a time
    
    console.log(`📦 Fetching ${messageIds.length} emails in batches of ${batchSize}...`);

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      
      // Fetch emails in parallel within batch
      const batchPromises = batch.map(async (messageId) => {
        try {
          const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Cc', 'Bcc', 'Date', 'Subject']
          });

          return this.parseEmailMetadata(response.data);
        } catch (error) {
          console.error(`⚠️ Failed to fetch message ${messageId}:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      emails.push(...batchResults.filter(e => e !== null));

      // Progress callback
      if (onProgress) {
        onProgress({
          processed: Math.min(i + batchSize, messageIds.length),
          total: messageIds.length,
          percentage: Math.round((Math.min(i + batchSize, messageIds.length) / messageIds.length) * 100)
        });
      }

      console.log(`✅ Processed ${Math.min(i + batchSize, messageIds.length)} / ${messageIds.length} emails`);

      // Rate limiting - wait 100ms between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🎉 Successfully fetched ${emails.length} emails`);
    return emails;
  }

  /**
   * Parse email metadata to extract contacts
   */
  parseEmailMetadata(message) {
    const headers = {};
    
    if (message.payload && message.payload.headers) {
      message.payload.headers.forEach(header => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }

    return {
      id: message.id,
      threadId: message.threadId,
      from: this.parseEmailAddress(headers.from),
      to: this.parseEmailAddresses(headers.to),
      cc: this.parseEmailAddresses(headers.cc),
      bcc: this.parseEmailAddresses(headers.bcc),
      date: headers.date ? new Date(headers.date) : null,
      subject: headers.subject || ''
    };
  }

  /**
   * Parse single email address string
   */
  parseEmailAddress(str) {
    if (!str) return null;
    
    // Format: "John Doe <john@example.com>" or "john@example.com"
    const match = str.match(/([^<]*)?<?([^>]+)>?/);
    
    if (match) {
      const name = (match[1] || '').trim().replace(/"/g, '');
      const email = (match[2] || '').trim().toLowerCase();
      
      return {
        name: name || null,
        email: email,
        raw: str
      };
    }
    
    return null;
  }

  /**
   * Parse multiple email addresses
   */
  parseEmailAddresses(str) {
    if (!str) return [];
    
    // Split by comma
    const addresses = str.split(',').map(s => s.trim());
    
    return addresses
      .map(addr => this.parseEmailAddress(addr))
      .filter(addr => addr !== null);
  }

  /**
   * Extract all unique contacts from emails
   * @param {Array} emails - Array of email metadata
   * @returns {Array} Array of unique contacts
   */
  extractContactsFromEmails(emails) {
    const contactMap = new Map();

    emails.forEach(email => {
      // Extract from 'from' field
      if (email.from && email.from.email) {
        this.addContactToMap(contactMap, email.from, email.date);
      }

      // Extract from 'to' field
      email.to.forEach(contact => {
        if (contact.email) {
          this.addContactToMap(contactMap, contact, email.date);
        }
      });

      // Extract from 'cc' field
      email.cc.forEach(contact => {
        if (contact.email) {
          this.addContactToMap(contactMap, contact, email.date);
        }
      });
    });

    // Convert map to array
    const contacts = Array.from(contactMap.values());
    
    console.log(`👥 Extracted ${contacts.length} unique contacts from ${emails.length} emails`);
    
    return contacts;
  }

  /**
   * Add contact to map (deduplicate by email)
   */
  addContactToMap(contactMap, contact, emailDate) {
    const email = contact.email.toLowerCase();
    
    if (contactMap.has(email)) {
      // Update if this email is more recent
      const existing = contactMap.get(email);
      
      if (!existing.lastContactDate || (emailDate && emailDate > existing.lastContactDate)) {
        existing.lastContactDate = emailDate;
      }
      
      // Update name if we have a better one
      if (contact.name && contact.name.length > 2 && !existing.name) {
        existing.name = contact.name;
      }
    } else {
      // Add new contact
      contactMap.set(email, {
        email: email,
        name: contact.name || null,
        lastContactDate: emailDate,
        source: 'gmail_scan'
      });
    }
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new GmailService();
