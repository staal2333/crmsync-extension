/**
 * Debug Logger Utility
 * Respects CONFIG.DEBUG flag for production builds
 */

// Global debug flag (loaded from config)
let DEBUG_MODE = true;

// Try to load from CONFIG if available
try {
  if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG !== undefined) {
    DEBUG_MODE = CONFIG.DEBUG;
  }
} catch (e) {
  // CONFIG not loaded yet, default to true
}

/**
 * Debug logger that only logs when DEBUG mode is enabled
 */
const logger = {
  log: (...args) => {
    if (DEBUG_MODE) console.log(...args);
  },
  
  info: (...args) => {
    if (DEBUG_MODE) console.info(...args);
  },
  
  warn: (...args) => {
    // Always show warnings
    console.warn(...args);
  },
  
  error: (...args) => {
    // Always show errors
    console.error(...args);
  },
  
  debug: (...args) => {
    if (DEBUG_MODE) console.debug(...args);
  },
  
  group: (label) => {
    if (DEBUG_MODE) console.group(label);
  },
  
  groupEnd: () => {
    if (DEBUG_MODE) console.groupEnd();
  },
  
  table: (data) => {
    if (DEBUG_MODE) console.table(data);
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.logger = logger;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}
