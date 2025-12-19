// Background service worker for Chrome extension

// Import subscription service
importScripts('subscriptionService.js');

/**
 * @typedef {'outbound' | 'inbound'} EmailDirection
 */

/**
 * @typedef {Object} EmailMessage
 * @property {EmailDirection} direction
 * @property {string} subject
 * @property {string} timestamp ISO-8601 string
 */

/**
 * @typedef {Object} CrmContact
 * @property {string} email
 * @property {string | null | undefined} [name] // Legacy field for backward compatibility
 * @property {string | null | undefined} [firstName]
 * @property {string | null | undefined} [lastName]
 * @property {string | null | undefined} [company]
 * @property {string | null | undefined} [title]
 * @property {string | null | undefined} [phone]
 * @property {string | undefined} [firstContactAt]
 * @property {string | undefined} [lastContactAt]
 * @property {number | undefined} [outboundCount]
 * @property {number | undefined} [inboundCount]
 * @property {EmailMessage[] | undefined} [messages]
 * @property {'pending' | 'approved' | 'archived' | 'lost' | string | undefined} [status]
 * @property {'no_reply' | 'replied' | 'bounced' | null | undefined} [threadStatus] // Computed thread status
 * @property {'positive' | 'objection' | 'meeting_booked' | 'not_interested' | 'bounce' | null | undefined} [replyCategory] // Reply classification
 * @property {string[] | undefined} [tags] // Tags like 'campaign', 'source', etc.
 * @property {string | undefined} [campaign] // Primary campaign tag
 * @property {string | undefined} [id] // legacy field for compatibility
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [lastUpdated]
 * @property {string | undefined} [lastReviewedAt] // ISO timestamp when contact was last reviewed
 * @property {string | undefined} [followUpDate] // ISO timestamp for follow-up reminder
 */

/**
 * Split a full name into firstName and lastName.
 * Middle names are included with firstName.
 * Single-word names go to firstName.
 * @param {string} fullName
 * @returns {{ firstName: string | null, lastName: string | null }}
 */
function splitName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: null, lastName: null };
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: null, lastName: null };
  }

  // Split by whitespace
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  } else if (parts.length === 1) {
    // Single word goes to firstName
    return { firstName: parts[0], lastName: null };
  } else {
    // Last word is lastName, everything else is firstName
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return { firstName, lastName };
  }
}

/**
 * Get full name from firstName and lastName.
 * @param {string | null | undefined} firstName
 * @param {string | null | undefined} lastName
 * @returns {string}
 */
function getFullName(firstName, lastName) {
  const parts = [firstName, lastName].filter(p => p && p.trim().length > 0);
  return parts.join(' ');
}

/**
 * Tier limits configuration
 */
const TIER_LIMITS = {
  free: {
    contacts: 50,
    exports: 10
  },
  pro: {
    contacts: 1000,
    exports: -1 // unlimited
  },
  enterprise: {
    contacts: -1, // unlimited
    exports: -1
  }
};

/**
 * Get user's current tier
 * @returns {Promise<string>} 'free', 'pro', or 'enterprise'
 */
async function getUserTier() {
  try {
    const { user, isGuest } = await chrome.storage.local.get(['user', 'isGuest']);
    
    // Guest users are always free tier
    if (isGuest || !user) {
      return 'free';
    }
    
    // Authenticated users have tier in their user object
    return user.tier || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free'; // Default to free on error
  }
}

/**
 * Check if user can add contacts (soft limit)
 * Returns true if CURRENT count is under limit (allows going slightly over)
 * @param {number} currentCount - Current number of contacts
 * @returns {Promise<{allowed: boolean, reason?: string, limit: number, tier: string}>}
 */
async function checkContactLimit(currentCount) {
  const tier = await getUserTier();
  const limit = TIER_LIMITS[tier].contacts;
  
  // Unlimited tier
  if (limit === -1) {
    return { allowed: true, limit: -1, tier };
  }
  
  // Soft limit: can START operation if under limit
  if (currentCount < limit) {
    return { allowed: true, limit, tier };
  }
  
  // At or over limit
  return {
    allowed: false,
    reason: `Contact limit reached (${currentCount}/${limit}). ${tier === 'free' ? 'Upgrade to Pro for 1,000 contacts.' : 'Delete contacts to add more.'}`,
    limit,
    tier
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  const defaultSettings = {
      darkMode: false,
      autoApprove: false,
      reminderDays: 3,
    sidebarEnabled: true,
    trackedLabels: [], // Array of Gmail label names to track
    noReplyAfterDays: [3, 7, 14], // Days after which to flag no-reply contacts for follow-up
    soundEffects: false // Enable subtle sound effects on button clicks
  };

  // Initialize local storage for contact data and a local copy of settings.
  const result = await chrome.storage.local.get(['contacts']);
  const existingContacts = result.contacts || [];
  
  // Migrate existing contacts to ensure they have required fields
  let needsMigration = false;
  const migratedContacts = existingContacts.map(contact => {
    const needsUpdate = !contact.status || !contact.lastContactAt || contact.status === 'New' || 
                        (contact.name && !contact.firstName && !contact.lastName);
    if (needsUpdate) {
      needsMigration = true;
      const updated = {
        ...contact,
        status: contact.status === 'pending' ? 'pending' : 'approved',
        lastContactAt: contact.lastContactAt || contact.lastContact || contact.createdAt || new Date().toISOString(),
        firstContactAt: contact.firstContactAt || contact.createdAt || new Date().toISOString()
      };
      
      // Split name if exists but firstName/lastName don't
      if (contact.name && !contact.firstName && !contact.lastName) {
        const { firstName, lastName } = splitName(contact.name);
        updated.firstName = firstName;
        updated.lastName = lastName;
      }
      
      return updated;
    }
    return contact;
  });

  if (needsMigration && migratedContacts.length > 0) {
    await chrome.storage.local.set({ contacts: migratedContacts });
  }

  // Initialize if no contacts exist
  if (existingContacts.length === 0) {
    await chrome.storage.local.set({
      contacts: /** @type {CrmContact[]} */ ([]),
      settings: defaultSettings
    });
  } else if (!result.settings) {
    await chrome.storage.local.set({ settings: defaultSettings });
  }

  // Initialize synced settings for user preferences (no contact data in sync).
  chrome.storage.sync.get(['settings'], (syncResult) => {
    const existing = syncResult && syncResult.settings;
    if (!existing) {
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
});

/**
 * Handle authentication from website
 * @param {Object} data - Auth data from website
 * @param {string} data.token - JWT or session token
 * @param {Object} data.user - User information
 * @param {string} data.user.email - User email
 * @param {string} data.user.name - User name
 * @param {string} data.user.tier - User subscription tier (free, pro, enterprise)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function handleWebsiteAuth(data) {
  try {
    console.log('🔐 Handling website authentication:', data);
    
    if (!data || !data.token || !data.user) {
      throw new Error('Invalid authentication data');
    }
    
    // Store auth data
    await chrome.storage.local.set({
      authToken: data.token,
      user: {
        email: data.user.email,
        name: data.user.name || '',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        tier: data.user.tier || 'free',
        avatar: data.user.avatar || ''
      },
      isAuthenticated: true,
      isGuest: false,
      authTimestamp: Date.now()
    });
    
    // Store tier in sync storage for access across devices
    await chrome.storage.sync.set({
      userTier: data.user.tier || 'free'
    });
    
    console.log('✅ Authentication successful! User tier:', data.user.tier);
    
    return { 
      success: true, 
      message: 'Authentication successful',
      tier: data.user.tier 
    };
  } catch (error) {
    console.error('❌ Error handling website auth:', error);
    throw error;
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received message:', request.action || request.type);
  
  // Legacy action-based messages
  if (request.action === 'saveContact') {
    saveContact(request.contact).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error saving contact:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'getContacts') {
    chrome.storage.local.get(['contacts'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting contacts:', chrome.runtime.lastError);
        sendResponse({ contacts: [] });
      } else {
        sendResponse({ contacts: result.contacts || [] });
      }
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'updateContact') {
    updateContact(request.contact).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error updating contact:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'deleteContact') {
    deleteContact(request.email).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error deleting contact:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'getSettings') {
    // Merge settings from local + sync (async helper), sync wins.
    getSettings()
      .then(settings => sendResponse({ settings }))
      .catch(error => {
        console.error('Error getting settings', error);
        sendResponse({ settings: { darkMode: false, autoApprove: false, reminderDays: 3, sidebarEnabled: true, trackedLabels: [], noReplyAfterDays: [3, 7, 14], soundEffects: false, hotkeysEnabled: false } });
      });
    return true;
  } else if (request.action === 'updateSettings') {
    const settings = request.settings || {};
    // Persist full settings locally.
    chrome.storage.local.set({ settings });
    // Persist user preferences to sync (never contacts).
    chrome.storage.sync.set({
      settings: {
        darkMode: !!settings.darkMode,
        autoApprove: !!settings.autoApprove,
        reminderDays: typeof settings.reminderDays === 'number' ? settings.reminderDays : 3,
        sidebarEnabled: settings.sidebarEnabled !== false,
        trackedLabels: Array.isArray(settings.trackedLabels) ? settings.trackedLabels : [],
        noReplyAfterDays: Array.isArray(settings.noReplyAfterDays) ? settings.noReplyAfterDays : [3, 7, 14],
        soundEffects: !!settings.soundEffects,
        hotkeysEnabled: settings.hotkeysEnabled === true
      },
      // Store exclusions at top level for easy access
      excludeNames: Array.isArray(settings.excludeNames) ? settings.excludeNames : [],
      excludeDomains: Array.isArray(settings.excludeDomains) ? settings.excludeDomains : [],
      excludePhones: Array.isArray(settings.excludePhones) ? settings.excludePhones : []
    });
    sendResponse({ success: true });
  } else   if (request.action === 'authFromWebsite') {
    // Handle authentication from website
    handleWebsiteAuth(request.data)
      .then((result) => sendResponse(result))
      .catch(error => {
        console.error('Error handling website auth:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  } else if (request.action === 'getContactLimit') {
    // Get contact limit info for UI display
    getContacts()
      .then(async (contacts) => {
        const tier = await getUserTier();
        const limit = TIER_LIMITS[tier].contacts;
        const count = contacts.length;
        const limitCheck = await checkContactLimit(count);
        
        sendResponse({
          success: true,
          count: count,
          limit: limit,
          tier: tier,
          canAdd: limitCheck.allowed,
          percentUsed: limit > 0 ? Math.round((count / limit) * 100) : 0,
          isOverLimit: count > limit && limit > 0,
          isNearLimit: limit > 0 && count >= limit * 0.9
        });
      })
      .catch(error => {
        console.error('Error getting contact limit:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === 'updateContactMetadata') {
    updateContactMetadata(request.contact)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Error updating contact metadata:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // New type-based messages (structured events)
  if (request.type === 'INBOUND_EMAIL' && request.payload) {
    mergeInboundEmail(request.payload)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error merging inbound email:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'EMAIL_SENT' && request.payload) {
    // EMAIL_SENT is informational; actual persistence happens on CONFIRM_ADD
    sendResponse && sendResponse({ success: true });
    return true;
  }

  if (request.type === 'CONFIRM_ADD' && request.payload) {
    upsertOutboundFromConfirmAdd(request.payload)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error handling CONFIRM_ADD:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'GET_EXPORT_DATA') {
    getExportData(request.payload)
      .then(contacts => {
        sendResponse && sendResponse({ success: true, contacts });
      })
      .catch(error => {
        console.error('Error getting export data:', error);
        sendResponse && sendResponse({ success: false, error: error.message, contacts: [] });
      });
    return true;
  }

  if (request.type === 'GET_EXPORT_PREVIEW') {
    // Today-only contacts for popup preview
    getExportData(undefined)
      .then(contacts => {
        sendResponse && sendResponse({ success: true, contacts });
      })
      .catch(error => {
        console.error('Error getting export preview data:', error);
        sendResponse && sendResponse({ success: false, error: error.message, contacts: [] });
      });
    return true;
  }

  if (request.type === 'EXPORT_CSV_TODAY') {
    exportCsvForToday()
      .then(result => {
        sendResponse && sendResponse(result);
      })
      .catch(error => {
        console.error('Error exporting CSV for today:', error);
        sendResponse && sendResponse({ success: false, message: error.message });
      });
    return true;
  }

  if (request.type === 'GET_PENDING_CONTACTS') {
    getPendingContacts()
      .then(contacts => {
        sendResponse && sendResponse({ success: true, contacts });
      })
      .catch(error => {
        console.error('Error getting pending contacts:', error);
        sendResponse && sendResponse({ success: false, error: error.message, contacts: [] });
      });
    return true;
  }

  if (request.type === 'APPROVE_CONTACT' && request.payload && request.payload.email) {
    approveContactByEmail(request.payload.email)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error approving contact:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'GET_DASHBOARD_STATS') {
    getDashboardStats()
      .then(stats => sendResponse && sendResponse({ success: true, stats }))
      .catch(error => {
        console.error('Error getting dashboard stats:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'GET_DAILY_REVIEW') {
    getDailyReview()
      .then(reviewData => sendResponse && sendResponse({ success: true, reviewData }))
      .catch(error => {
        console.error('Error getting daily review:', error);
        sendResponse && sendResponse({ success: false, error: error.message, reviewData: { contacts: [], stats: {} } });
      });
    return true;
  }

  if (request.type === 'GET_CONTACT_DETAILS' && request.payload && request.payload.email) {
    getContactDetails(request.payload.email)
      .then(contact => sendResponse && sendResponse({ success: true, contact }))
      .catch(error => {
        console.error('Error getting contact details:', error);
        sendResponse && sendResponse({ success: false, contact: null });
      });
    return true;
  }

  if (request.type === 'EXPORT_AND_MARK_REVIEWED') {
    exportAndMarkReviewed()
      .then(result => sendResponse && sendResponse(result))
      .catch(error => {
        console.error('Error exporting and marking reviewed:', error);
        sendResponse && sendResponse({ success: false, message: error.message });
      });
    return true;
  }

  if (request.type === 'MERGE_CONTACTS' && request.payload && request.payload.emails) {
    mergeContacts(request.payload.emails)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error merging contacts:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'UPDATE_CONTACT_TAGS' && request.payload && request.payload.email && Array.isArray(request.payload.tags)) {
    updateContactTags(request.payload.email, request.payload.tags)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error updating contact tags:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'ARCHIVE_CONTACT' && request.payload && request.payload.email) {
    archiveContact(request.payload.email)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error archiving contact:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'MARK_CONTACT_LOST' && request.payload && request.payload.email) {
    markContactLost(request.payload.email)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error marking contact as lost:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'SCHEDULE_FOLLOWUP' && request.payload && request.payload.email && request.payload.followUpDate) {
    scheduleFollowUp(request.payload.email, request.payload.followUpDate)
      .then(() => sendResponse && sendResponse({ success: true }))
      .catch(error => {
        console.error('Error scheduling follow-up:', error);
        sendResponse && sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'EXPORT_CSV_CUSTOM' && request.payload && request.payload.contacts) {
    generateAndDownloadCsv(request.payload.contacts)
      .then(result => sendResponse && sendResponse(result))
      .catch(error => {
        console.error('Error exporting custom CSV:', error);
        sendResponse && sendResponse({ success: false, message: error.message });
      });
    return true;
  }

  if (request.type === 'CLEAR_CONTACTS') {
    // Clear all contacts synchronously via chrome.storage to guarantee a response.
    chrome.storage.local.set({ contacts: [] }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing contacts:', chrome.runtime.lastError);
        sendResponse && sendResponse({ success: false, message: chrome.runtime.lastError.message });
      } else {
        sendResponse && sendResponse({ success: true });
      }
    });
    return true;
  }

  // ============================================
  // Subscription Management Messages
  // ============================================
  
  if (request.type === 'GET_SUBSCRIPTION') {
    subscriptionService.getSubscriptionStatus(request.forceRefresh || false)
      .then(subscription => {
        sendResponse(subscription);
      })
      .catch(error => {
        console.error('Error fetching subscription:', error);
        sendResponse(subscriptionService.getFreeTierStatus());
      });
    return true;
  }

  if (request.type === 'CHECK_FEATURE_ACCESS') {
    subscriptionService.canPerformAction(request.feature)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error checking feature access:', error);
        sendResponse({ allowed: false, reason: 'Error checking subscription', upgradeRequired: true });
      });
    return true;
  }

  if (request.type === 'OPEN_PRICING') {
    subscriptionService.openPricingPage();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'TRACK_EXPORT') {
    subscriptionService.trackExport()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error tracking export:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'INVALIDATE_SUBSCRIPTION_CACHE') {
    subscriptionService.invalidateCache();
    sendResponse({ success: true });
    return true;
  }

  return true;
});

/**
 * Legacy saveContact used by older content flows.
 * Kept for compatibility; writes into the same CrmContact array.
 * @param {CrmContact} contact
 */
async function saveContact(contact) {
  const contacts = await getContacts();
  
  // Normalize email
  const normalizedEmail = (contact.email || '').toLowerCase();
  if (!normalizedEmail) {
    console.error('saveContact: No email provided');
    return;
  }
  
  // Check if contact already exists
  const existingIndex = contacts.findIndex(c => (c.email || '').toLowerCase() === normalizedEmail);
  
  const now = new Date().toISOString();
  const lastContactAt = contact.lastContactAt || contact.lastContact || now;
  
  if (existingIndex >= 0) {
    // Merge with existing contact
    contacts[existingIndex] = {
      ...contacts[existingIndex],
      ...contact,
      email: normalizedEmail, // Ensure normalized email
      status: contact.status || contacts[existingIndex].status || 'approved', // Set status to approved if not set
      lastContactAt: lastContactAt, // Ensure lastContactAt is set
      firstContactAt: contacts[existingIndex].firstContactAt || contacts[existingIndex].createdAt || now,
      lastUpdated: now
    };
  } else {
    // Check contact limit before adding new contact (soft limit - allows starting operation if under limit)
    const limitCheck = await checkContactLimit(contacts.length);
    if (!limitCheck.allowed) {
      console.warn('Contact limit reached:', limitCheck.reason);
      // Show upgrade notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Contact Limit Reached',
        message: limitCheck.reason || 'Upgrade to Pro to add more contacts',
        buttons: [
          { title: 'View Plans' },
          { title: 'Dismiss' }
        ]
      });
      throw new Error(limitCheck.reason);
    }

    // Add new contact
    contacts.push({
      ...contact,
      email: normalizedEmail, // Ensure normalized email
      status: contact.status || 'approved', // Default to approved when saving
      lastContactAt: lastContactAt, // Ensure lastContactAt is set
      firstContactAt: contact.firstContactAt || contact.createdAt || now,
      id: Date.now().toString(),
      createdAt: now,
      lastUpdated: now,
      outboundCount: contact.outboundCount || 0,
      inboundCount: contact.inboundCount || 0,
      messages: contact.messages || [],
      tags: contact.tags || []
    });
  }
  
  await chrome.storage.local.set({ contacts });
}

/**
 * Legacy updateContact used by older content flows.
 * @param {CrmContact} contact
 */
async function updateContact(contact) {
  const contacts = await getContacts();
  
  // Try to find by ID first, then by email
  let index = contacts.findIndex(c => c.id === contact.id);
  if (index < 0 && contact.email) {
    const normalizedEmail = contact.email.toLowerCase();
    index = contacts.findIndex(c => (c.email || '').toLowerCase() === normalizedEmail);
  }
  
  if (index >= 0) {
    const now = new Date().toISOString();
    contacts[index] = {
      ...contacts[index],
      ...contact,
      email: contact.email ? contact.email.toLowerCase() : contacts[index].email,
      lastContactAt: contact.lastContactAt || contact.lastContact || contacts[index].lastContactAt || contacts[index].lastContact || now,
      status: contact.status || contacts[index].status || 'approved', // Ensure status is set
      lastUpdated: now
    };
    await chrome.storage.local.set({ contacts });
  } else {
    // If not found, save as new contact
    await saveContact(contact);
  }
}

/**
 * Delete a contact by email.
 * @param {string} email
 */
async function deleteContact(email) {
  if (!email) {
    throw new Error('Email is required to delete contact');
  }
  
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  
  // Filter out the contact with the matching email
  const filteredContacts = contacts.filter(c => (c.email || '').toLowerCase() !== normalizedEmail);
  
  if (filteredContacts.length === contacts.length) {
    throw new Error('Contact not found');
  }
  
  await chrome.storage.local.set({ contacts: filteredContacts });
}

/**
 * Update outbound metadata and thread state for a contact.
 * @param {{ email: string; lastOutboundAt?: string; lastOutboundSubject?: string; lastOutboundThreadId?: string | null; awaitingReply?: boolean; followUpDue?: boolean; followUpDate?: string; outboundMessage?: EmailMessage }} payload
 */
async function updateContactMetadata(payload) {
  if (!payload || !payload.email) return;
  const normalizedEmail = payload.email.toLowerCase();
  const contacts = await getContacts();

  const index = contacts.findIndex(c => (c.email || '').toLowerCase() === normalizedEmail);
  if (index === -1) {
    return; // Only enrich existing contacts; creation happens elsewhere
  }

  const now = new Date().toISOString();
  const contact = { ...contacts[index] };

  if (payload.lastOutboundAt) {
    contact.lastOutboundAt = payload.lastOutboundAt;
    contact.lastContactAt = payload.lastOutboundAt;
  }
  if (payload.lastOutboundSubject) {
    contact.lastOutboundSubject = payload.lastOutboundSubject;
  }
  if (typeof payload.lastOutboundThreadId !== 'undefined') {
    contact.lastOutboundThreadId = payload.lastOutboundThreadId;
  }
  if (typeof payload.awaitingReply === 'boolean') {
    contact.awaitingReply = payload.awaitingReply;
  }
  if (typeof payload.followUpDue === 'boolean') {
    contact.followUpDue = payload.followUpDue;
  }
  if (payload.followUpDate) {
    contact.followUpDate = payload.followUpDate;
  }

  // Append outbound message if provided
  if (payload.outboundMessage && payload.outboundMessage.timestamp) {
    contact.messages = Array.isArray(contact.messages) ? contact.messages : [];
    contact.messages.push(payload.outboundMessage);
  }

  contact.outboundCount = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;
  contact.outboundCount += 1;
  contact.threadStatus = computeThreadStatus(contact);
  contact.lastUpdated = now;

  contacts[index] = contact;
  await setContacts(contacts);
}

async function exportCSV() {
  try {
    const contacts = await getContacts();
    return await generateAndDownloadCsv(contacts);
  } catch (error) {
    console.error('Export CSV error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Generate CSV from CrmContact[] and trigger a download via chrome.downloads.
 * Column order: email,name,company,title,phone,firstContactAt,lastContactAt,outboundCount,inboundCount
 * @param {CrmContact[]} contacts
 * @returns {Promise<{ success: boolean; message?: string; csvContent?: string; filename?: string }>}
 */
async function generateAndDownloadCsv(contacts) {
  console.log('generateAndDownloadCsv called with', contacts?.length, 'contacts');
  
  // Filter out pending contacts, but include contacts with no status or 'approved' status
  const exportable = (contacts || []).filter(contact => {
    const status = contact.status || '';
    // Include if status is 'approved', empty, or not 'pending'
    return status !== 'pending';
  });

  console.log('Exportable contacts:', exportable.length);

  if (!exportable || exportable.length === 0) {
    return { success: false, message: 'No contacts to export' };
  }
  
  const headers = [
    'email',
    'firstName',
    'lastName',
    'company',
    'title',
    'phone',
    'threadStatus',
    'tags',
    'firstContactAt',
    'lastContactAt',
    'outboundCount',
    'inboundCount'
  ];

  const rows = exportable.map(contact => {
    const tags = Array.isArray(contact.tags) ? contact.tags.join('; ') : '';
    // Use firstName/lastName if available, otherwise split name for backward compatibility
    let firstName = contact.firstName || '';
    let lastName = contact.lastName || '';
    if (!firstName && !lastName && contact.name) {
      const split = splitName(contact.name);
      firstName = split.firstName || '';
      lastName = split.lastName || '';
    }
    return [
      contact.email || '',
      firstName,
      lastName,
      contact.company || '',
      contact.title || '',
      contact.phone || '',
      contact.threadStatus || '',
      tags,
      contact.firstContactAt || '',
      contact.lastContactAt || '',
      typeof contact.outboundCount === 'number' ? contact.outboundCount : 0,
      typeof contact.inboundCount === 'number' ? contact.inboundCount : 0
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // In Manifest V3 service workers, we can't use Blob/URL.createObjectURL
  // Instead, convert to data URL directly
  const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const filename = `crm-export-${yyyy}-${mm}-${dd}.csv`;
  
  try {
    console.log('Starting download:', filename);
    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });
    console.log('Download started successfully');
    return { success: true, message: `Exported ${exportable.length} contacts`, filename };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, message: error.message || 'Download failed' };
  }
}

/**
 * Export CSV limited to today's contacts.
 * @returns {Promise<{ success: boolean; message?: string; csvContent?: string; filename?: string }>}
 */
async function exportCsvForToday() {
  const todaysContacts = await getExportData(undefined);
  return generateAndDownloadCsv(todaysContacts);
}

/**
 * Return only contacts that are still pending approval.
 * @returns {Promise<CrmContact[]>}
 */
async function getPendingContacts() {
  const contacts = await getContacts();
  return contacts.filter(contact => contact.status === 'pending');
}

/**
 * Mark a contact as approved by email (case-insensitive).
 * @param {string} email
 */
async function approveContactByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();

  const index = contacts.findIndex(c => (c.email || '').toLowerCase() === normalizedEmail);
  if (index === -1) return;

  const nowIso = new Date().toISOString();
  contacts[index].status = 'approved';
  contacts[index].lastUpdated = nowIso;

  await setContacts(contacts);
}

/**
 * Compute thread status from contact's email activity.
 * @param {CrmContact} contact
 * @returns {'no_reply' | 'replied' | 'bounced' | null}
 */
function computeThreadStatus(contact) {
  const outbound = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;
  const inbound = typeof contact.inboundCount === 'number' ? contact.inboundCount : 0;

  // Check for bounce indicators in messages
  if (contact.messages && Array.isArray(contact.messages)) {
    for (const msg of contact.messages) {
      const subject = (msg.subject || '').toLowerCase();
      if (subject.includes('undeliverable') || 
          subject.includes('delivery failure') || 
          subject.includes('mail delivery failed') ||
          subject.includes('bounce') ||
          subject.includes('returned mail')) {
        return 'bounced';
      }
    }
  }

  if (outbound > 0 && inbound === 0) {
    return 'no_reply';
  }
  
  if (inbound > 0) {
    return 'replied';
  }

  return null;
}

/**
 * Update thread status for a contact and persist.
 * @param {CrmContact} contact
 */
async function updateThreadStatus(contact) {
  const contacts = await getContacts();
  const index = contacts.findIndex(c => c.email === contact.email);
  if (index >= 0) {
    contacts[index].threadStatus = computeThreadStatus(contacts[index]);
    contacts[index].lastUpdated = new Date().toISOString();
    await setContacts(contacts);
  }
}

/**
 * Compute dashboard stats from stored contacts and message history.
 * - totalContacts: all contacts
 * - newToday: contacts whose firstContactAt is today
 * - awaitingReplies: contacts with outbound > 0 and inbound === 0
 * - pendingApprovals: contacts with status === 'pending'
 * @returns {Promise<{ totalContacts: number; newToday: number; awaitingReplies: number; pendingApprovals: number }>}
 */
async function getDashboardStats() {
  const contacts = await getContacts();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fromTime = startOfToday.getTime();
  const toTime = endOfToday.getTime();

  let totalContacts = contacts.length;
  let newToday = 0;
  let awaitingReplies = 0;
  let pendingApprovals = 0;

  for (const contact of contacts) {
    // Update thread status if not set or outdated
    const currentStatus = computeThreadStatus(contact);
    if (contact.threadStatus !== currentStatus) {
      contact.threadStatus = currentStatus;
      // Don't await here to avoid blocking, but we'll update in batch later
    }

    if (contact.firstContactAt) {
      const t = new Date(contact.firstContactAt).getTime();
      if (!Number.isNaN(t) && t >= fromTime && t <= toTime) {
        newToday++;
      }
    }

    const outbound = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;
    const inbound = typeof contact.inboundCount === 'number' ? contact.inboundCount : 0;
    if (outbound > 0 && inbound === 0) {
      awaitingReplies++;
    }

    if (contact.status === 'pending') {
      pendingApprovals++;
    }
  }

  return { totalContacts, newToday, awaitingReplies, pendingApprovals };
}

/**
 * Get all contacts from storage, always returning an array.
 * @returns {Promise<CrmContact[]>}
 */
async function getContacts() {
  const result = await chrome.storage.local.get(['contacts']);
  const contacts = Array.isArray(result.contacts) ? result.contacts : [];
  return contacts;
}

/**
 * Replace all contacts in storage.
 * @param {CrmContact[]} contacts
 */
async function setContacts(contacts) {
  await chrome.storage.local.set({ contacts });
}

/**
 * Upsert a contact and email history entry based on a confirmed outbound email.
 * @param {{ recipients: string[]; subject?: string; sentAt?: string; direction?: string; source?: string }} payload
 */
async function upsertOutboundFromConfirmAdd(payload) {
  const primaryEmail = (payload.recipients && payload.recipients[0] || '').toLowerCase();
  if (!primaryEmail) {
    return;
  }

  const contacts = await getContacts();
  let contact = contacts.find(c => c.email === primaryEmail);
  const nowIso = new Date().toISOString();
  const timestamp = payload.sentAt || nowIso;

  /** @type {EmailMessage} */
  const message = {
    direction: 'outbound',
    subject: payload.subject || '',
    timestamp
  };

  if (!contact) {
    contact = {
      email: primaryEmail,
      firstName: null,
      lastName: null,
      company: null,
      title: null,
      phone: null,
      firstContactAt: timestamp,
      lastContactAt: timestamp,
      outboundCount: 1,
      inboundCount: 0,
      messages: [message],
      tags: [],
      threadStatus: 'no_reply',
      createdAt: nowIso,
      lastUpdated: nowIso,
      id: Date.now().toString(),
      status: 'approved'
    };
    contacts.push(contact);
  } else {
    const outboundCount = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;

    contact.messages = Array.isArray(contact.messages) ? contact.messages : [];
    contact.messages.push(message);

    if (!contact.firstContactAt) {
      contact.firstContactAt = timestamp;
    }
    contact.lastContactAt = timestamp;
    contact.outboundCount = outboundCount + 1;
    contact.lastUpdated = nowIso;
    if (!contact.status) {
      contact.status = 'approved';
    }
    // Update thread status
    contact.threadStatus = computeThreadStatus(contact);
  }

  await setContacts(contacts);
}

/**
 * Merge inbound email metadata into a contact record keyed by email.
 * Only fills missing profile fields; does not overwrite existing values.
 * Also tracks inbound counts, timestamps, and per-contact email history.
 * @param {{ email: string; name?: string | null; firstName?: string | null; lastName?: string | null; company?: string | null; title?: string | null; phone?: string | null; receivedAt?: string }} inbound
 */
async function mergeInboundEmail(inbound) {
  const email = (inbound.email || '').toLowerCase();
  if (!email) {
    return;
  }

  const contacts = await getContacts();

  let contact = contacts.find(c => c.email === email);

  const nowIso = new Date().toISOString();
  const timestamp = inbound.receivedAt || nowIso;

  /** @type {EmailMessage} */
  const message = {
    direction: 'inbound',
    subject: '', // subject not available from current payload
    timestamp
  };

  // Check auto-approve setting
  const settingsResult = await chrome.storage.sync.get(['settings']);
  const localSettingsResult = await chrome.storage.local.get(['settings']);
  const settings = {
    ...(localSettingsResult.settings || {}),
    ...(settingsResult.settings || {})
  };
  const shouldAutoApprove = settings.autoApprove || false;

  if (!contact) {
    // Handle name splitting
    let firstName = inbound.firstName || null;
    let lastName = inbound.lastName || null;
    if (!firstName && !lastName && inbound.name) {
      const split = splitName(inbound.name);
      firstName = split.firstName;
      lastName = split.lastName;
    }
    
    contact = {
      email,
      firstName,
      lastName,
      company: inbound.company || null,
      title: inbound.title || null,
      phone: inbound.phone || null,
      firstContactAt: timestamp,
      lastContactAt: timestamp,
      outboundCount: 0,
      inboundCount: 1,
      messages: [message],
      tags: [],
      threadStatus: 'replied',
      status: shouldAutoApprove ? 'approved' : 'New',
      createdAt: nowIso,
      lastUpdated: nowIso,
      id: Date.now().toString()
    };
    contacts.push(contact);
  } else {
    const inboundCount = typeof contact.inboundCount === 'number' ? contact.inboundCount : 0;

    // Smart field updates: fill missing OR update with better/more complete data
    // Name: update if missing or new one is longer/more complete
    if (inbound.firstName || inbound.lastName) {
      // If inbound has firstName/lastName, use them directly
      if (inbound.firstName && (!contact.firstName || inbound.firstName.length > contact.firstName.length)) {
        contact.firstName = inbound.firstName;
      }
      if (inbound.lastName && (!contact.lastName || inbound.lastName.length > contact.lastName.length)) {
        contact.lastName = inbound.lastName;
      }
    } else if (inbound.name) {
      // If inbound has legacy name field, split it
      const existingFullName = getFullName(contact.firstName, contact.lastName);
      if (!existingFullName || 
          (inbound.name.length > existingFullName.length && 
           inbound.name.split(' ').length >= existingFullName.split(' ').length)) {
        const split = splitName(inbound.name);
        contact.firstName = split.firstName;
        contact.lastName = split.lastName;
      }
    }
    
    // Company: update if missing or new one is more complete (longer, has company markers)
    if (inbound.company) {
      if (!contact.company) {
        contact.company = inbound.company;
      } else {
        // Update if new company name is longer and contains company markers (A/S, Ltd, etc.)
        const companyMarkers = /(A\/S|ApS|IVS|Ltd|Limited|GmbH|AG|SA|SAS|BV|NV|Inc|Corp|Corporation)/i;
        const newHasMarker = companyMarkers.test(inbound.company);
        const existingHasMarker = companyMarkers.test(contact.company);
        
        if (newHasMarker && !existingHasMarker) {
          contact.company = inbound.company; // New has marker, existing doesn't
        } else if (inbound.company.length > contact.company.length + 3) {
          // New is significantly longer (likely more complete)
          contact.company = inbound.company;
        }
      }
    }
    
    // Job Title: update if missing or new one is more specific (longer)
    if (inbound.title) {
      if (!contact.title) {
        contact.title = inbound.title;
      } else {
        // Update if new title is longer (more specific) or contains "Senior", "Lead", "Chief", etc.
        const seniorKeywords = /(Senior|Lead|Chief|Head|Director|VP|President|CEO|CTO|CFO)/i;
        const newHasSenior = seniorKeywords.test(inbound.title);
        const existingHasSenior = seniorKeywords.test(contact.title);
        
        if (newHasSenior && !existingHasSenior) {
          contact.title = inbound.title;
        } else if (inbound.title.length > contact.title.length + 5) {
          contact.title = inbound.title;
        }
      }
    }
    
    // Phone: update if missing or new one has country code/extensions
    if (inbound.phone) {
      if (!contact.phone) {
        contact.phone = inbound.phone;
      } else {
        // Update if new phone has country code (+) and existing doesn't
        const newHasCountryCode = inbound.phone.includes('+');
        const existingHasCountryCode = contact.phone.includes('+');
        const newHasExtension = /(ext|ext\.|x|#)\s*\d+/i.test(inbound.phone);
        const existingHasExtension = /(ext|ext\.|x|#)\s*\d+/i.test(contact.phone);
        
        if ((newHasCountryCode && !existingHasCountryCode) ||
            (newHasExtension && !existingHasExtension) ||
            (inbound.phone.replace(/\D/g, '').length > contact.phone.replace(/\D/g, '').length)) {
          contact.phone = inbound.phone;
        }
      }
    }

    contact.messages = Array.isArray(contact.messages) ? contact.messages : [];
    contact.messages.push(message);

    if (!contact.firstContactAt) {
      contact.firstContactAt = timestamp;
    }
    contact.lastContactAt = timestamp;
    contact.inboundCount = inboundCount + 1;
    contact.lastUpdated = nowIso;
    // Update thread status
    contact.threadStatus = computeThreadStatus(contact);
    // Classify reply
    contact.replyCategory = classifyReply(contact);

    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) {
      contacts[index] = contact;
    }
  }

  await setContacts(contacts);
}

/**
 * Return CrmContact array for a given date range (or today by default).
 * Used by popup via GET_EXPORT_DATA.
 * @param {{ dateRange?: { from?: string; to?: string } } | undefined} payload
 * @returns {Promise<CrmContact[]>}
 */
async function getExportData(payload) {
  const contacts = await getContacts();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let from = startOfToday;
  let to = endOfToday;

  if (payload && payload.dateRange) {
    if (payload.dateRange.from) {
      const fromParsed = new Date(payload.dateRange.from);
      if (!Number.isNaN(fromParsed.getTime())) {
        from = fromParsed;
      }
    }
    if (payload.dateRange.to) {
      const toParsed = new Date(payload.dateRange.to);
      if (!Number.isNaN(toParsed.getTime())) {
        to = toParsed;
      }
    }
  }

  const fromTime = from.getTime();
  const toTime = to.getTime();

  const filtered = contacts.filter(contact => {
    // Check both lastContactAt and lastContact (legacy field)
    const lastContactDate = contact.lastContactAt || contact.lastContact || contact.createdAt;
    if (!lastContactDate) {
      return false;
    }
    const t = new Date(lastContactDate).getTime();
    if (Number.isNaN(t)) return false;
    return t >= fromTime && t <= toTime;
  });

  return filtered;
}

/**
 * Get daily review data: today's contacts with next steps and stats.
 * @returns {Promise<{ contacts: CrmContact[]; stats: { newToday: number; awaitingReplies: number; followUpsDue: number; totalToday: number } }>}
 */
async function getDailyReview() {
  const contacts = await getContacts();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fromTime = startOfToday.getTime();
  const toTime = endOfToday.getTime();

  const todaysContacts = contacts.filter(contact => {
    if (!contact.lastContactAt) return false;
    const t = new Date(contact.lastContactAt).getTime();
    if (Number.isNaN(t)) return false;
    return t >= fromTime && t <= toTime;
  });

  let newToday = 0;
  let awaitingReplies = 0;
  let followUpsDue = 0;

  for (const contact of todaysContacts) {
    if (contact.firstContactAt) {
      const t = new Date(contact.firstContactAt).getTime();
      if (!Number.isNaN(t) && t >= fromTime && t <= toTime) {
        newToday++;
      }
    }

    const outbound = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;
    const inbound = typeof contact.inboundCount === 'number' ? contact.inboundCount : 0;
    if (outbound > 0 && inbound === 0) {
      awaitingReplies++;
    }

    if (contact.followUpDate) {
      const followUp = new Date(contact.followUpDate).getTime();
      if (!Number.isNaN(followUp) && followUp <= endOfToday.getTime()) {
        followUpsDue++;
      }
    }
  }

  // Update thread status for all contacts
  for (const contact of todaysContacts) {
    contact.threadStatus = computeThreadStatus(contact);
  }

  // Sort by lastContactAt descending
  todaysContacts.sort((a, b) => {
    const aTime = new Date(a.lastContactAt || 0).getTime();
    const bTime = new Date(b.lastContactAt || 0).getTime();
    return bTime - aTime;
  });

  // Detect duplicates for merge suggestions
  const duplicates = detectDuplicates(todaysContacts);

  // Get follow-up queue (no-reply contacts after X days)
  const followUpQueue = await getFollowUpQueue();
  
  // Classify replies and get wins/objections
  const winsAndObjections = getWinsAndObjections(contacts);

  return {
    contacts: todaysContacts,
    duplicates,
    followUpQueue,
    winsAndObjections,
    stats: {
      newToday,
      awaitingReplies,
      followUpsDue,
      totalToday: todaysContacts.length,
      positiveReplies: winsAndObjections.positive.length,
      objections: winsAndObjections.objections.length,
      meetingsBooked: winsAndObjections.meetings.length
    }
  };
}

/**
 * Get follow-up queue: contacts with no reply after configured days.
 * @returns {Promise<Array<{ contact: CrmContact; daysSinceLastContact: number; lastOutboundMessage: EmailMessage | null }>>}
 */
async function getFollowUpQueue() {
  const contacts = await getContacts();
  const settings = await getSettings();
  const noReplyDays = Array.isArray(settings.noReplyAfterDays) ? settings.noReplyAfterDays : [3, 7, 14];
  
  const now = new Date();
  const queue = [];

  for (const contact of contacts) {
    // Skip if already replied, archived, or lost
    if (contact.inboundCount > 0 || contact.status === 'archived' || contact.status === 'lost') {
      continue;
    }

    // Must have sent at least one email
    const outbound = typeof contact.outboundCount === 'number' ? contact.outboundCount : 0;
    if (outbound === 0) continue;

    // Find last outbound message
    const lastOutbound = contact.messages && Array.isArray(contact.messages)
      ? contact.messages.filter(m => m.direction === 'outbound').sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0]
      : null;

    // Base daysSince on last outbound timestamp if present
    let daysSince = null;
    if (lastOutbound && lastOutbound.timestamp) {
      const lastContactDate = new Date(lastOutbound.timestamp);
      daysSince = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Primary trigger: explicit followUpDate, if present
    const hasFollowUpDate = contact.followUpDate && !Number.isNaN(new Date(contact.followUpDate).getTime());
    if (hasFollowUpDate) {
      const due = new Date(contact.followUpDate);
      if (due.getTime() <= now.getTime()) {
        queue.push({
          contact,
          daysSinceLastContact: daysSince !== null ? daysSince : Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
          lastOutboundMessage: lastOutbound || null
        });
        continue;
      }
    }

    // Fallback trigger: match configured no-reply days based on last outbound
    if (daysSince !== null && noReplyDays.includes(daysSince)) {
      queue.push({
        contact,
        daysSinceLastContact: daysSince,
        lastOutboundMessage: lastOutbound || null
      });
    }
  }

  // Sort by days since (most urgent first)
  queue.sort((a, b) => a.daysSinceLastContact - b.daysSinceLastContact);

  return queue;
}

/**
 * Classify reply category from contact's inbound messages.
 * @param {CrmContact} contact
 * @returns {'positive' | 'objection' | 'meeting_booked' | 'not_interested' | 'bounce' | null}
 */
function classifyReply(contact) {
  if (!contact.messages || !Array.isArray(contact.messages)) {
    return null;
  }

  // Get all inbound messages
  const inboundMessages = contact.messages.filter(m => m.direction === 'inbound');
  if (inboundMessages.length === 0) {
    return null;
  }

  // Check for bounce first
  if (contact.threadStatus === 'bounced') {
    return 'bounce';
  }

  // Combine all inbound message subjects and look for keywords
  const allText = inboundMessages.map(m => (m.subject || '').toLowerCase()).join(' ');

  // Meeting booked keywords
  const meetingKeywords = ['calendar', 'meeting', 'call', 'zoom', 'calendly', 'schedule', 'book', 'appointment', 'time slot'];
  if (meetingKeywords.some(kw => allText.includes(kw))) {
    return 'meeting_booked';
  }

  // Positive keywords
  const positiveKeywords = ['interested', 'yes', "let's", 'sounds good', 'love to', 'would like', 'definitely', 'absolutely'];
  if (positiveKeywords.some(kw => allText.includes(kw))) {
    return 'positive';
  }

  // Not interested keywords
  const notInterestedKeywords = ['no thanks', 'unsubscribe', 'remove', 'not interested', 'not a fit', 'pass', 'decline'];
  if (notInterestedKeywords.some(kw => allText.includes(kw))) {
    return 'not_interested';
  }

  // Objection keywords
  const objectionKeywords = ['not right now', 'budget', 'timing', 'later', 'maybe', 'consider', 'think about'];
  if (objectionKeywords.some(kw => allText.includes(kw))) {
    return 'objection';
  }

  // If replied but no clear category, default to positive (they engaged)
  return 'positive';
}

/**
 * Get wins and objections from all contacts.
 * @param {CrmContact[]} contacts
 * @returns {{ positive: CrmContact[]; objections: CrmContact[]; meetings: CrmContact[]; notInterested: CrmContact[] }}
 */
function getWinsAndObjections(contacts) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fromTime = startOfToday.getTime();
  const toTime = endOfToday.getTime();

  const positive = [];
  const objections = [];
  const meetings = [];
  const notInterested = [];

  for (const contact of contacts) {
    // Only include contacts with activity today
    if (!contact.lastContactAt) continue;
    const lastContactTime = new Date(contact.lastContactAt).getTime();
    if (Number.isNaN(lastContactTime) || lastContactTime < fromTime || lastContactTime > toTime) {
      continue;
    }

    // Classify reply if not already classified
    if (!contact.replyCategory && contact.inboundCount > 0) {
      contact.replyCategory = classifyReply(contact);
    }

    const category = contact.replyCategory;
    if (!category) continue;

    switch (category) {
      case 'positive':
        positive.push(contact);
        break;
      case 'objection':
        objections.push(contact);
        break;
      case 'meeting_booked':
        meetings.push(contact);
        break;
      case 'not_interested':
        notInterested.push(contact);
        break;
    }
  }

  return { positive, objections, meetings, notInterested };
}

/**
 * Detect potential duplicate contacts based on email, name similarity, or company.
 * @param {CrmContact[]} contacts
 * @returns {Array<{ contacts: CrmContact[]; reason: string }>} Array of duplicate groups
 */
function detectDuplicates(contacts) {
  const duplicates = [];
  const processed = new Set();

  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(i)) continue;

    const contact1 = contacts[i];
    const group = [contact1];
    let reason = '';

    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(j)) continue;

      const contact2 = contacts[j];

      // Same email (case-insensitive)
      if (contact1.email.toLowerCase() === contact2.email.toLowerCase()) {
        group.push(contact2);
        reason = 'Same email address';
        processed.add(j);
        continue;
      }

      // Similar names and same company
      if (contact1.name && contact2.name && contact1.company && contact2.company) {
        const name1 = contact1.name.toLowerCase().trim();
        const name2 = contact2.name.toLowerCase().trim();
        const company1 = contact1.company.toLowerCase().trim();
        const company2 = contact2.company.toLowerCase().trim();

        if (company1 === company2) {
          // Check name similarity (simple: same first/last name parts)
          const name1Parts = name1.split(/\s+/);
          const name2Parts = name2.split(/\s+/);
          
          if (name1Parts.length >= 2 && name2Parts.length >= 2) {
            const first1 = name1Parts[0];
            const last1 = name1Parts[name1Parts.length - 1];
            const first2 = name2Parts[0];
            const last2 = name2Parts[name2Parts.length - 1];

            if ((first1 === first2 && last1 === last2) || 
                (first1 === last2 && last1 === first2)) {
              group.push(contact2);
              reason = 'Similar name, same company';
              processed.add(j);
            }
          }
        }
      }
    }

    if (group.length > 1) {
      duplicates.push({ contacts: group, reason });
      processed.add(i);
    }
  }

  return duplicates;
}

/**
 * Merge multiple contacts into one (keeps the first contact, merges data from others).
 * @param {string[]} emails Array of email addresses to merge
 * @returns {Promise<void>}
 */
async function mergeContacts(emails) {
  if (!Array.isArray(emails) || emails.length < 2) {
    throw new Error('Need at least 2 contacts to merge');
  }

  const contacts = await getContacts();
  const normalizedEmails = emails.map(e => e.toLowerCase());
  
  // Find all contacts to merge
  const toMerge = contacts.filter(c => normalizedEmails.includes(c.email.toLowerCase()));
  if (toMerge.length < 2) {
    throw new Error('Could not find all contacts to merge');
  }

  // Use the first contact as the base (prefer the one with most data)
  toMerge.sort((a, b) => {
    const aData = (a.name ? 1 : 0) + (a.company ? 1 : 0) + (a.phone ? 1 : 0) + (a.title ? 1 : 0);
    const bData = (b.name ? 1 : 0) + (b.company ? 1 : 0) + (b.phone ? 1 : 0) + (b.title ? 1 : 0);
    return bData - aData;
  });

  const baseContact = toMerge[0];
  const others = toMerge.slice(1);

  // Merge data from other contacts
  for (const other of others) {
    if (!baseContact.name && other.name) baseContact.name = other.name;
    if (!baseContact.company && other.company) baseContact.company = other.company;
    if (!baseContact.title && other.title) baseContact.title = other.title;
    if (!baseContact.phone && other.phone) baseContact.phone = other.phone;
    
    // Merge message history
    if (other.messages && Array.isArray(other.messages)) {
      baseContact.messages = Array.isArray(baseContact.messages) ? baseContact.messages : [];
      baseContact.messages.push(...other.messages);
    }

    // Merge counts
    baseContact.outboundCount = (baseContact.outboundCount || 0) + (other.outboundCount || 0);
    baseContact.inboundCount = (baseContact.inboundCount || 0) + (other.inboundCount || 0);

    // Merge tags
    if (other.tags && Array.isArray(other.tags)) {
      baseContact.tags = Array.isArray(baseContact.tags) ? baseContact.tags : [];
      for (const tag of other.tags) {
        if (!baseContact.tags.includes(tag)) {
          baseContact.tags.push(tag);
        }
      }
    }

    // Use earliest firstContactAt
    if (other.firstContactAt) {
      if (!baseContact.firstContactAt || new Date(other.firstContactAt) < new Date(baseContact.firstContactAt)) {
        baseContact.firstContactAt = other.firstContactAt;
      }
    }

    // Use latest lastContactAt
    if (other.lastContactAt) {
      if (!baseContact.lastContactAt || new Date(other.lastContactAt) > new Date(baseContact.lastContactAt)) {
        baseContact.lastContactAt = other.lastContactAt;
      }
    }
  }

  // Update thread status
  baseContact.threadStatus = computeThreadStatus(baseContact);
  baseContact.lastUpdated = new Date().toISOString();

  // Remove merged contacts and update base
  const remainingContacts = contacts.filter(c => !normalizedEmails.includes(c.email.toLowerCase()));
  remainingContacts.push(baseContact);

  await setContacts(remainingContacts);
}

/**
 * Update tags for a contact.
 * @param {string} email
 * @param {string[]} tags
 * @returns {Promise<void>}
 */
async function updateContactTags(email, tags) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  
  const index = contacts.findIndex(c => c.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    throw new Error('Contact not found');
  }

  contacts[index].tags = Array.isArray(tags) ? tags.filter(t => t && t.trim().length > 0) : [];
  contacts[index].lastUpdated = new Date().toISOString();

  await setContacts(contacts);
}

/**
 * Get contact details by email.
 * @param {string} email
 * @returns {Promise<CrmContact | null>}
 */
async function getContactDetails(email) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  return contacts.find(c => c.email.toLowerCase() === normalizedEmail) || null;
}

// Note: CLEAR_CONTACTS uses chrome.storage.local.set directly in the message
// handler to avoid any chance of not sending a response back to the popup.

/**
 * Export today's contacts to CSV and mark them all as reviewed.
 * @returns {Promise<{ success: boolean; message?: string; filename?: string }>}
 */
async function exportAndMarkReviewed() {
  const todaysContacts = await getExportData(undefined);
  
  if (todaysContacts.length === 0) {
    return { success: false, message: 'No contacts to export for today.' };
  }

  // Mark all today's contacts as reviewed
  const nowIso = new Date().toISOString();
  const allContacts = await getContacts();
  
  for (const contact of todaysContacts) {
    const index = allContacts.findIndex(c => c.email === contact.email);
    if (index >= 0) {
      allContacts[index].lastReviewedAt = nowIso;
      allContacts[index].lastUpdated = nowIso;
    }
  }
  
  await setContacts(allContacts);

  // Export CSV
  return await generateAndDownloadCsv(todaysContacts);
}

/**
 * Get settings from storage (merged local + sync).
 * @returns {Promise<{ darkMode: boolean; autoApprove: boolean; reminderDays: number; sidebarEnabled: boolean; trackedLabels: string[]; noReplyAfterDays: number[]; soundEffects: boolean; hotkeysEnabled: boolean }>}
 */
async function getSettings() {
  const defaultSettings = {
    darkMode: false,
    autoApprove: false,
    reminderDays: 3,
    sidebarEnabled: true,
    trackedLabels: [],
    noReplyAfterDays: [3, 7, 14],
    soundEffects: false,
    hotkeysEnabled: false,
    excludeNames: [],
    excludeDomains: [],
    excludePhones: []
  };

  const localResult = await chrome.storage.local.get(['settings']);
  const syncResult = await chrome.storage.sync.get([
    'settings',
    'excludeNames',
    'excludeDomains',
    'excludePhones'
  ]);

  return {
    ...defaultSettings,
    ...(localResult.settings || {}),
    ...(syncResult.settings || {}),
    // Load exclusion arrays from top-level sync storage (set by onboarding)
    excludeNames: syncResult.excludeNames || defaultSettings.excludeNames,
    excludeDomains: syncResult.excludeDomains || defaultSettings.excludeDomains,
    excludePhones: syncResult.excludePhones || defaultSettings.excludePhones,
    noReplyAfterDays: Array.isArray((syncResult.settings && syncResult.settings.noReplyAfterDays) || (localResult.settings && localResult.settings.noReplyAfterDays))
      ? ((syncResult.settings && syncResult.settings.noReplyAfterDays) || (localResult.settings && localResult.settings.noReplyAfterDays) || [3, 7, 14])
      : [3, 7, 14]
  };
}

/**
 * Archive a contact by email.
 * @param {string} email
 * @returns {Promise<void>}
 */
async function archiveContact(email) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  
  const index = contacts.findIndex(c => c.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    throw new Error('Contact not found');
  }

  contacts[index].status = 'archived';
  contacts[index].lastUpdated = new Date().toISOString();

  await setContacts(contacts);
}

/**
 * Mark a contact as lost by email.
 * @param {string} email
 * @returns {Promise<void>}
 */
async function markContactLost(email) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  
  const index = contacts.findIndex(c => c.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    throw new Error('Contact not found');
  }

  contacts[index].status = 'lost';
  contacts[index].lastUpdated = new Date().toISOString();

  await setContacts(contacts);
}

/**
 * Schedule a follow-up for a contact.
 * @param {string} email
 * @param {string} followUpDate ISO timestamp
 * @returns {Promise<void>}
 */
async function scheduleFollowUp(email, followUpDate) {
  const normalizedEmail = email.toLowerCase();
  const contacts = await getContacts();
  
  const index = contacts.findIndex(c => c.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    throw new Error('Contact not found');
  }

  contacts[index].followUpDate = followUpDate;
  contacts[index].lastUpdated = new Date().toISOString();

  await setContacts(contacts);
}

// ============================================================================
// AUTH & SYNC INTEGRATION
// ============================================================================

/**
 * Initialize authentication and sync on extension startup
 * NOTE: Auth and sync logic are in popup context, not service worker
 * Service worker just handles basic checks
 */
async function initializeAuthAndSync() {
  try {
    // Check if user is authenticated
    const { isAuthenticated, authToken, isGuest } = await chrome.storage.local.get([
      'isAuthenticated',
      'authToken',
      'isGuest'
    ]);
    
    if (isAuthenticated && authToken) {
      console.log('✅ User authenticated');
    } else if (isGuest) {
      console.log('👤 Guest mode active');
    } else {
      console.log('👋 First time user');
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

// Initialize on extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 CRMSYNC starting up...');
  initializeAuthAndSync();
});

// Also initialize when extension is installed/updated  
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First time installation - show onboarding
    console.log('📦 Extension installed - showing onboarding');
    
    // Check if onboarding was already completed (shouldn't be, but check anyway)
    const { onboardingCompleted } = await chrome.storage.local.get(['onboardingCompleted']);
    
    if (!onboardingCompleted) {
      // Open onboarding page
      chrome.tabs.create({
        url: chrome.runtime.getURL('onboarding.html')
      });
    }
    
    setTimeout(() => {
      initializeAuthAndSync();
    }, 500);
  } else if (details.reason === 'update') {
    console.log('📦 Extension updated');
    setTimeout(() => {
      initializeAuthAndSync();
    }, 500);
  }
});