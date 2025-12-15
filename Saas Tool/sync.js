// Data synchronization module for CRMSYNC Extension
// Handles syncing contacts, messages, and settings between local storage and backend

const API_URL = 'https://crmsync-extension.onrender.com/api'; // Production backend URL

class SyncManager {
  constructor() {
    this.syncing = false;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.lastSyncAt = null;
    this.syncQueue = {
      contactsAdded: [],
      contactsUpdated: [],
      contactsDeleted: [],
      messagesAdded: [],
      settingsUpdated: null
    };
  }
  
  /**
   * Initialize sync manager
   * Starts periodic sync and listens for changes
   */
  async init() {
    // Load last sync time
    const { lastSyncAt } = await chrome.storage.local.get(['lastSyncAt']);
    this.lastSyncAt = lastSyncAt || null;
    
    // Check if user is authenticated
    const isAuth = await window.CRMSyncAuth.isAuthenticated();
    if (!isAuth) {
      console.log('⏸️ Sync disabled: User not authenticated');
      return;
    }
    
    console.log('🔄 Sync manager initialized');
    
    // Perform initial sync
    await this.performFullSync();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Listen for local changes to trigger sync
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        if (changes.contacts || changes.settings) {
          this.queueLocalChanges(changes);
        }
      }
    });
  }
  
  /**
   * Start periodic background sync
   */
  startPeriodicSync() {
    setInterval(async () => {
      const isAuth = await window.CRMSyncAuth.isAuthenticated();
      if (isAuth && !this.syncing) {
        await this.performIncrementalSync();
      }
    }, this.syncInterval);
    
    console.log(`⏰ Periodic sync enabled (every ${this.syncInterval / 1000 / 60} minutes)`);
  }
  
  /**
   * Perform full synchronization
   * Used for initial sync or manual sync
   */
  async performFullSync() {
    if (this.syncing) {
      console.log('⏭️ Sync already in progress, skipping');
      return;
    }
    
    this.syncing = true;
    console.log('🔄 Starting full sync...');
    
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Get local data
      const localData = await this.getLocalData();
      
      // Call full sync endpoint
      const response = await fetch(`${API_URL}/sync/full`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastSyncAt: this.lastSyncAt,
          localData: {
            contacts: localData.contacts,
            messages: localData.messages,
            settings: localData.settings
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      const syncData = await response.json();
      
      // Apply server changes locally
      await this.applyServerData(syncData.serverData);
      
      // Update last sync time
      this.lastSyncAt = syncData.lastSyncAt;
      await chrome.storage.local.set({ lastSyncAt: this.lastSyncAt });
      
      // Clear sync queue
      this.clearSyncQueue();
      
      console.log('✅ Full sync completed:', syncData.lastSyncAt);
      
      // Notify user
      this.showSyncNotification('Synced with cloud');
    } catch (error) {
      console.error('❌ Full sync error:', error);
      this.showSyncNotification('Sync failed', true);
    } finally {
      this.syncing = false;
    }
  }
  
  /**
   * Perform incremental synchronization
   * Only syncs changes since last sync
   */
  async performIncrementalSync() {
    if (this.syncing) {
      return;
    }
    
    // Skip if no changes
    if (this.isSyncQueueEmpty()) {
      console.log('⏭️ No changes to sync');
      return;
    }
    
    this.syncing = true;
    console.log('🔄 Starting incremental sync...');
    
    try {
      const token = await window.CRMSyncAuth.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call incremental sync endpoint
      const response = await fetch(`${API_URL}/sync/incremental`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastSyncAt: this.lastSyncAt,
          changes: this.syncQueue
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }
      
      const syncData = await response.json();
      
      // Apply server changes
      if (syncData.changes) {
        await this.applyServerChanges(syncData.changes);
      }
      
      // Handle conflicts
      if (syncData.conflicts && syncData.conflicts.length > 0) {
        console.warn('⚠️ Conflicts detected:', syncData.conflicts);
        await this.resolveConflicts(syncData.conflicts);
      }
      
      // Update last sync time
      this.lastSyncAt = syncData.lastSyncAt;
      await chrome.storage.local.set({ lastSyncAt: this.lastSyncAt });
      
      // Clear sync queue
      this.clearSyncQueue();
      
      console.log('✅ Incremental sync completed');
    } catch (error) {
      console.error('❌ Incremental sync error:', error);
    } finally {
      this.syncing = false;
    }
  }
  
  /**
   * Get all local data for syncing
   */
  async getLocalData() {
    const { contacts, settings } = await chrome.storage.local.get(['contacts', 'settings']);
    
    // Extract messages from contacts
    const messages = [];
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach(contact => {
        if (contact.messages && Array.isArray(contact.messages)) {
          contact.messages.forEach(msg => {
            messages.push({
              ...msg,
              contactEmail: contact.email
            });
          });
        }
      });
    }
    
    return {
      contacts: contacts || [],
      messages,
      settings: settings || {}
    };
  }
  
  /**
   * Apply server data to local storage (full sync)
   */
  async applyServerData(serverData) {
    const { contacts: localContacts } = await chrome.storage.local.get(['contacts']);
    let contacts = localContacts || [];
    
    // Apply server contacts (server wins in full sync)
    if (serverData.contacts && serverData.contacts.length > 0) {
      for (const serverContact of serverData.contacts) {
        const index = contacts.findIndex(c => c.email === serverContact.email);
        if (index >= 0) {
          // Update existing
          contacts[index] = this.normalizeContact(serverContact);
        } else {
          // Add new
          contacts.push(this.normalizeContact(serverContact));
        }
      }
    }
    
    // Remove deleted contacts
    if (serverData.deletedContactIds && serverData.deletedContactIds.length > 0) {
      contacts = contacts.filter(c => !serverData.deletedContactIds.includes(c.email));
    }
    
    // Save contacts
    await chrome.storage.local.set({ contacts });
    
    // Apply settings
    if (serverData.settings) {
      await chrome.storage.local.set({ settings: serverData.settings });
    }
    
    console.log(`📦 Applied ${serverData.contacts?.length || 0} contacts from server`);
  }
  
  /**
   * Apply server changes (incremental sync)
   */
  async applyServerChanges(changes) {
    const { contacts } = await chrome.storage.local.get(['contacts']);
    let localContacts = contacts || [];
    
    // Add new contacts
    if (changes.contactsAdded && changes.contactsAdded.length > 0) {
      for (const serverContact of changes.contactsAdded) {
        const exists = localContacts.find(c => c.email === serverContact.email);
        if (!exists) {
          localContacts.push(this.normalizeContact(serverContact));
        }
      }
    }
    
    // Update contacts
    if (changes.contactsUpdated && changes.contactsUpdated.length > 0) {
      for (const serverContact of changes.contactsUpdated) {
        const index = localContacts.findIndex(c => c.email === serverContact.email);
        if (index >= 0) {
          // Merge (server timestamp wins)
          const serverTime = new Date(serverContact.lastUpdated || 0).getTime();
          const localTime = new Date(localContacts[index].lastUpdated || 0).getTime();
          
          if (serverTime >= localTime) {
            localContacts[index] = this.normalizeContact(serverContact);
          }
        }
      }
    }
    
    // Delete contacts
    if (changes.contactsDeleted && changes.contactsDeleted.length > 0) {
      localContacts = localContacts.filter(c => !changes.contactsDeleted.includes(c.email));
    }
    
    await chrome.storage.local.set({ contacts: localContacts });
  }
  
  /**
   * Normalize contact from server format to local format
   */
  normalizeContact(serverContact) {
    return {
      email: serverContact.email,
      firstName: serverContact.firstName || serverContact.first_name,
      lastName: serverContact.lastName || serverContact.last_name,
      company: serverContact.company,
      title: serverContact.title,
      phone: serverContact.phone,
      linkedin: serverContact.linkedin,
      firstContactAt: serverContact.firstContactAt || serverContact.first_contact_at,
      lastContactAt: serverContact.lastContactAt || serverContact.last_contact_at,
      outboundCount: serverContact.outboundCount || serverContact.outbound_count || 0,
      inboundCount: serverContact.inboundCount || serverContact.inbound_count || 0,
      status: serverContact.status || 'approved',
      threadStatus: serverContact.threadStatus || serverContact.thread_status,
      replyCategory: serverContact.replyCategory || serverContact.reply_category,
      followUpDate: serverContact.followUpDate || serverContact.follow_up_date,
      lastReviewedAt: serverContact.lastReviewedAt || serverContact.last_reviewed_at,
      tags: serverContact.tags || [],
      messages: serverContact.messages || [],
      createdAt: serverContact.createdAt || serverContact.created_at,
      lastUpdated: serverContact.lastUpdated || serverContact.updated_at || new Date().toISOString()
    };
  }
  
  /**
   * Queue local changes for next sync
   */
  queueLocalChanges(changes) {
    // This is simplified - in production you'd track specific changes
    console.log('📝 Local changes detected, will sync on next interval');
  }
  
  /**
   * Check if sync queue is empty
   */
  isSyncQueueEmpty() {
    return (
      this.syncQueue.contactsAdded.length === 0 &&
      this.syncQueue.contactsUpdated.length === 0 &&
      this.syncQueue.contactsDeleted.length === 0 &&
      this.syncQueue.messagesAdded.length === 0 &&
      !this.syncQueue.settingsUpdated
    );
  }
  
  /**
   * Clear sync queue
   */
  clearSyncQueue() {
    this.syncQueue = {
      contactsAdded: [],
      contactsUpdated: [],
      contactsDeleted: [],
      messagesAdded: [],
      settingsUpdated: null
    };
  }
  
  /**
   * Resolve conflicts (simple strategy: server wins)
   */
  async resolveConflicts(conflicts) {
    console.log('🔀 Resolving conflicts (server wins)...');
    const { contacts } = await chrome.storage.local.get(['contacts']);
    let localContacts = contacts || [];
    
    for (const conflict of conflicts) {
      const index = localContacts.findIndex(c => c.email === conflict.serverData.email);
      if (index >= 0) {
        localContacts[index] = this.normalizeContact(conflict.serverData);
      }
    }
    
    await chrome.storage.local.set({ contacts: localContacts });
  }
  
  /**
   * Show sync notification
   */
  showSyncNotification(message, isError = false) {
    // Send message to popup/content script to show notification
    chrome.runtime.sendMessage({
      type: 'SYNC_STATUS',
      message,
      isError,
      timestamp: new Date().toISOString()
    }).catch(() => {
      // Ignore if no listeners
    });
  }
  
  /**
   * Manual sync trigger
   */
  async manualSync() {
    console.log('🔄 Manual sync triggered');
    this.showSyncNotification('Syncing...');
    await this.performFullSync();
  }
  
  /**
   * Get sync status
   */
  async getSyncStatus() {
    const isAuth = await window.CRMSyncAuth.isAuthenticated();
    
    if (!isAuth) {
      return {
        enabled: false,
        lastSyncAt: null,
        syncing: false,
        message: 'Not authenticated'
      };
    }
    
    return {
      enabled: true,
      lastSyncAt: this.lastSyncAt,
      syncing: this.syncing,
      queueSize: this.syncQueue.contactsAdded.length +
                 this.syncQueue.contactsUpdated.length +
                 this.syncQueue.contactsDeleted.length,
      message: this.syncing ? 'Syncing...' : 'Synced'
    };
  }
}

// Create singleton instance
const syncManager = new SyncManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.CRMSyncManager = syncManager;
}

// Export for background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = syncManager;
}

