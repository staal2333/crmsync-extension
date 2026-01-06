const pool = require('../config/database');

class SyncService {
  async fullSync(userId, lastSyncAt, localData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get server data changed since lastSyncAt
      const serverContacts = await this.getContactsSince(client, userId, lastSyncAt);
      const serverMessages = await this.getMessagesSince(client, userId, lastSyncAt);
      const serverSettings = await this.getSettings(client, userId);
      const deletedIds = await this.getDeletedContactIds(client, userId, lastSyncAt);
      
      // Upload local changes
      if (localData) {
        await this.uploadLocalChanges(client, userId, localData);
      }
      
      await client.query('COMMIT');
      
      // Update sync metadata
      const now = new Date().toISOString();
      await pool.query(
        `UPDATE sync_metadata SET last_sync_at = $1 WHERE user_id = $2`,
        [now, userId]
      );
      
      return {
        serverData: {
          contacts: serverContacts,
          messages: serverMessages,
          settings: serverSettings,
          deletedContactIds: deletedIds,
        },
        lastSyncAt: now,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async incrementalSync(userId, lastSyncAt, changes) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Apply local changes to server
      const conflicts = await this.applyChanges(client, userId, changes);
      
      // Get server changes since lastSyncAt
      const serverChanges = {
        contactsAdded: await this.getContactsSince(client, userId, lastSyncAt),
        contactsUpdated: [],
        contactsDeleted: await this.getDeletedContactIds(client, userId, lastSyncAt),
        messagesAdded: await this.getMessagesSince(client, userId, lastSyncAt),
      };
      
      await client.query('COMMIT');
      
      const now = new Date().toISOString();
      await pool.query(
        `UPDATE sync_metadata SET last_sync_at = $1 WHERE user_id = $2`,
        [now, userId]
      );
      
      return {
        changes: serverChanges,
        lastSyncAt: now,
        conflicts,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getContactsSince(client, userId, since) {
    const query = since
      ? `SELECT 
          c.*,
          json_agg(
            json_build_object(
              'platform', m.platform,
              'crm_contact_id', m.crm_contact_id,
              'crm_record_type', m.crm_record_type,
              'last_synced', m.last_synced
            )
          ) FILTER (WHERE m.id IS NOT NULL) as crm_status
        FROM contacts c
        LEFT JOIN crm_contact_mappings m ON c.id = m.contact_id AND m.user_id = c.user_id
        WHERE c.user_id = $1 AND c.updated_at > $2 AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.updated_at DESC`
      : `SELECT 
          c.*,
          json_agg(
            json_build_object(
              'platform', m.platform,
              'crm_contact_id', m.crm_contact_id,
              'crm_record_type', m.crm_record_type,
              'last_synced', m.last_synced
            )
          ) FILTER (WHERE m.id IS NOT NULL) as crm_status
        FROM contacts c
        LEFT JOIN crm_contact_mappings m ON c.id = m.contact_id AND m.user_id = c.user_id
        WHERE c.user_id = $1 AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.updated_at DESC`;
    
    const params = since ? [userId, since] : [userId];
    const result = await client.query(query, params);
    
    return result.rows.map(this.mapContactFromDb);
  }
  
  async getMessagesSince(client, userId, since) {
    const query = since
      ? `SELECT em.* FROM email_messages em
         JOIN contacts c ON em.contact_id = c.id
         WHERE em.user_id = $1 AND em.created_at > $2 
         ORDER BY em.timestamp DESC LIMIT 1000`
      : `SELECT em.* FROM email_messages em
         WHERE em.user_id = $1
         ORDER BY em.timestamp DESC LIMIT 1000`;
    
    const params = since ? [userId, since] : [userId];
    const result = await client.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      contactId: row.contact_id,
      direction: row.direction,
      subject: row.subject,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  }
  
  async getSettings(client, userId) {
    const result = await client.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return {};
    }
    
    const row = result.rows[0];
    return {
      darkMode: row.dark_mode,
      autoApprove: row.auto_approve,
      reminderDays: row.reminder_days,
      sidebarEnabled: row.sidebar_enabled,
      trackedLabels: row.tracked_labels || [],
      noReplyAfterDays: row.no_reply_after_days || [3, 7, 14],
      soundEffects: row.sound_effects,
      hotkeysEnabled: row.hotkeys_enabled,
      excludeDomains: row.exclude_domains || [],
      excludeNames: row.exclude_names || [],
      excludePhones: row.exclude_phones || [],
    };
  }
  
  async getDeletedContactIds(client, userId, since) {
    if (!since) return [];
    
    const result = await client.query(
      `SELECT email FROM contacts WHERE user_id = $1 AND deleted_at IS NOT NULL AND deleted_at > $2`,
      [userId, since]
    );
    
    return result.rows.map(r => r.email);
  }
  
  async uploadLocalChanges(client, userId, localData) {
    const { contacts, messages, settings } = localData;
    
    // Upload contacts
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        await this.upsertContact(client, userId, contact);
      }
    }
    
    // Upload messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        await this.insertMessage(client, userId, message);
      }
    }
    
    // Upload settings
    if (settings) {
      await this.updateSettings(client, userId, settings);
    }
  }
  
  async applyChanges(client, userId, changes) {
    const conflicts = [];
    
    // Add new contacts
    if (changes.contactsAdded && changes.contactsAdded.length > 0) {
      for (const contact of changes.contactsAdded) {
        await this.upsertContact(client, userId, contact);
      }
    }
    
    // Update contacts
    if (changes.contactsUpdated && changes.contactsUpdated.length > 0) {
      for (const contact of changes.contactsUpdated) {
        await this.upsertContact(client, userId, contact);
      }
    }
    
    // Delete contacts (soft delete)
    if (changes.contactsDeleted && changes.contactsDeleted.length > 0) {
      for (const email of changes.contactsDeleted) {
        await client.query(
          `UPDATE contacts SET deleted_at = NOW() WHERE user_id = $1 AND email = $2`,
          [userId, email]
        );
      }
    }
    
    // Add messages
    if (changes.messagesAdded && changes.messagesAdded.length > 0) {
      for (const message of changes.messagesAdded) {
        await this.insertMessage(client, userId, message);
      }
    }
    
    // Update settings
    if (changes.settingsUpdated) {
      await this.updateSettings(client, userId, changes.settingsUpdated);
    }
    
    return conflicts;
  }
  
  async upsertContact(client, userId, contact) {
    const result = await client.query(
      `INSERT INTO contacts (
        user_id, email, first_name, last_name, company, title, phone, linkedin,
        first_contact_at, last_contact_at, outbound_count, inbound_count,
        status, thread_status, reply_category, follow_up_date, last_reviewed_at, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (user_id, email) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
        last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
        company = COALESCE(EXCLUDED.company, contacts.company),
        title = COALESCE(EXCLUDED.title, contacts.title),
        phone = COALESCE(EXCLUDED.phone, contacts.phone),
        linkedin = COALESCE(EXCLUDED.linkedin, contacts.linkedin),
        last_contact_at = EXCLUDED.last_contact_at,
        outbound_count = EXCLUDED.outbound_count,
        inbound_count = EXCLUDED.inbound_count,
        status = EXCLUDED.status,
        thread_status = EXCLUDED.thread_status,
        reply_category = EXCLUDED.reply_category,
        follow_up_date = EXCLUDED.follow_up_date,
        last_reviewed_at = EXCLUDED.last_reviewed_at,
        tags = EXCLUDED.tags,
        updated_at = NOW(),
        deleted_at = NULL
      RETURNING id`,
      [
        userId,
        contact.email.toLowerCase(),
        contact.firstName || contact.first_name || null,
        contact.lastName || contact.last_name || null,
        contact.company || null,
        contact.title || null,
        contact.phone || null,
        contact.linkedin || null,
        contact.firstContactAt || contact.first_contact_at || new Date().toISOString(),
        contact.lastContactAt || contact.last_contact_at || new Date().toISOString(),
        contact.outboundCount || contact.outbound_count || 0,
        contact.inboundCount || contact.inbound_count || 0,
        contact.status || 'approved',
        contact.threadStatus || contact.thread_status || null,
        contact.replyCategory || contact.reply_category || null,
        contact.followUpDate || contact.follow_up_date || null,
        contact.lastReviewedAt || contact.last_reviewed_at || null,
        contact.tags || [],
      ]
    );
    
    return result.rows[0];
  }
  
  async insertMessage(client, userId, message) {
    // Get contact_id first
    const contactEmail = message.contactEmail || message.email;
    if (!contactEmail) return;
    
    const contactResult = await client.query(
      `SELECT id FROM contacts WHERE user_id = $1 AND email = $2 AND deleted_at IS NULL`,
      [userId, contactEmail.toLowerCase()]
    );
    
    if (contactResult.rows.length === 0) {
      return; // Contact doesn't exist, skip message
    }
    
    const contactId = contactResult.rows[0].id;
    
    try {
      await client.query(
        `INSERT INTO email_messages (contact_id, user_id, direction, subject, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          contactId,
          userId,
          message.direction,
          message.subject || '',
          message.timestamp || new Date().toISOString()
        ]
      );
    } catch (error) {
      // Ignore duplicate message errors
      if (error.code !== '23505') {
        throw error;
      }
    }
  }
  
  async updateSettings(client, userId, settings) {
    await client.query(
      `INSERT INTO user_settings (
        user_id, dark_mode, auto_approve, reminder_days, sidebar_enabled,
        tracked_labels, no_reply_after_days, sound_effects, hotkeys_enabled,
        exclude_domains, exclude_names, exclude_phones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id) DO UPDATE SET
        dark_mode = EXCLUDED.dark_mode,
        auto_approve = EXCLUDED.auto_approve,
        reminder_days = EXCLUDED.reminder_days,
        sidebar_enabled = EXCLUDED.sidebar_enabled,
        tracked_labels = EXCLUDED.tracked_labels,
        no_reply_after_days = EXCLUDED.no_reply_after_days,
        sound_effects = EXCLUDED.sound_effects,
        hotkeys_enabled = EXCLUDED.hotkeys_enabled,
        exclude_domains = EXCLUDED.exclude_domains,
        exclude_names = EXCLUDED.exclude_names,
        exclude_phones = EXCLUDED.exclude_phones,
        updated_at = NOW()`,
      [
        userId,
        settings.darkMode !== undefined ? settings.darkMode : (settings.dark_mode !== undefined ? settings.dark_mode : false),
        settings.autoApprove !== undefined ? settings.autoApprove : (settings.auto_approve !== undefined ? settings.auto_approve : false),
        settings.reminderDays || settings.reminder_days || 3,
        settings.sidebarEnabled !== undefined ? settings.sidebarEnabled : (settings.sidebar_enabled !== undefined ? settings.sidebar_enabled : true),
        settings.trackedLabels || settings.tracked_labels || [],
        settings.noReplyAfterDays || settings.no_reply_after_days || [3, 7, 14],
        settings.soundEffects !== undefined ? settings.soundEffects : (settings.sound_effects !== undefined ? settings.sound_effects : false),
        settings.hotkeysEnabled !== undefined ? settings.hotkeysEnabled : (settings.hotkeys_enabled !== undefined ? settings.hotkeys_enabled : false),
        settings.excludeDomains || settings.exclude_domains || [],
        settings.excludeNames || settings.exclude_names || [],
        settings.excludePhones || settings.exclude_phones || [],
      ]
    );
  }
  
  mapContactFromDb(row) {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      title: row.title,
      phone: row.phone,
      linkedin: row.linkedin,
      source: row.source, // Contact source (hubspot, salesforce, gmail)
      crm_status: row.crm_status, // CRM sync mappings (array)
      firstContactAt: row.first_contact_at,
      lastContactAt: row.last_contact_at,
      outboundCount: row.outbound_count,
      inboundCount: row.inbound_count,
      status: row.status,
      threadStatus: row.thread_status,
      replyCategory: row.reply_category,
      followUpDate: row.follow_up_date,
      lastReviewedAt: row.last_reviewed_at,
      tags: row.tags || [],
      createdAt: row.created_at,
      lastUpdated: row.updated_at,
    };
  }
  
  async getContactsCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM contacts WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new SyncService();

