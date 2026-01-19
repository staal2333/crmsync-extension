// =====================================================
// CRMSYNC CONSTANTS
// =====================================================
// Centralized configuration values to avoid magic numbers

const CONSTANTS = {
  // Timing
  CACHE_DURATION_MS: 30000,        // 30 seconds - status cache
  DEBOUNCE_DELAY_MS: 300,          // 300ms - storage listener debounce
  TOAST_DURATION_MS: 3000,         // 3 seconds - toast display time
  TOAST_ERROR_DURATION_MS: 5000,   // 5 seconds - error toast
  RATE_LIMIT_DELAY_MS: 5000,       // 5 seconds - wait after rate limit
  SYNC_DELAY_BETWEEN_MS: 1000,     // 1 second - delay between bulk syncs
  SESSION_TIMEOUT_MS: 3600000,     // 1 hour - session timeout warning
  TOKEN_REFRESH_BUFFER_MS: 300000, // 5 minutes - refresh token early
  
  // Limits
  CONTACTS_PER_PAGE: 50,
  MAX_RETRIES: 3,
  FREE_TIER_LIMIT: 50,
  
  // UI
  SIDEBAR_DEFAULT_WIDTH: 320,
  SIDEBAR_MIN_WIDTH: 280,
  SIDEBAR_MAX_WIDTH: 500,
  
  // API
  API_TIMEOUT_MS: 30000,           // 30 seconds - API request timeout
  
  // Storage Keys
  STORAGE_KEYS: {
    CONTACTS: 'contacts',
    CONTACT_COUNT: 'contactCount',
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    SUBSCRIPTION: 'subscription',
    SETTINGS: 'settings',
    EXCLUDED_DOMAINS: 'excludedDomains',
    EXCLUDED_NAMES: 'excludedNames',
    EXCLUDED_PHONES: 'excludedPhones',
    REJECTED_EMAILS: 'rejectedEmails',
    PENDING_UPDATES: 'pendingUpdates',
    SYNC_HISTORY: 'syncHistory',
    LAST_SYNC_AT: 'lastSyncAt',
  },
  
  // Error Messages (user-friendly)
  ERROR_MESSAGES: {
    NETWORK: 'Network error. Please check your connection.',
    SESSION_EXPIRED: 'Session expired. Please sign in again.',
    RATE_LIMITED: 'Too many requests. Please wait a moment.',
    SYNC_FAILED: 'Failed to sync contact. Please try again.',
    GENERIC: 'Something went wrong. Please try again.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    CONTACT_SAVED: 'Contact saved successfully',
    CONTACT_SYNCED: 'Contact synced to CRM',
    SETTINGS_SAVED: 'Settings saved',
    LOGGED_OUT: 'Signed out successfully',
    DATA_CLEARED: 'All contacts cleared',
  }
};

// Freeze to prevent accidental modification
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.STORAGE_KEYS);
Object.freeze(CONSTANTS.ERROR_MESSAGES);
Object.freeze(CONSTANTS.SUCCESS_MESSAGES);

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}
