/**
 * CRMSYNC Configuration
 * 
 * This file contains environment-specific configuration.
 * Update these values before deployment.
 */

const CONFIG = {
  // API Configuration
  API: {
    // For local development
    LOCAL: 'http://localhost:3000',
    
    // For production (update this with your Render URL)
    PRODUCTION: 'https://crmsync-api.onrender.com',
    
    // Current environment (change to 'production' before deployment)
    ENVIRONMENT: 'local', // 'local' or 'production'
    
    // Get the current API URL based on environment
    get BASE_URL() {
      return this.ENVIRONMENT === 'production' ? this.PRODUCTION : this.LOCAL;
    }
  },
  
  // Website URLs
  WEBSITE: {
    // Pricing page URL
    PRICING: {
      LOCAL: 'http://localhost:3001/pricing',
      PRODUCTION: 'https://crmsync.com/pricing',
      
      get URL() {
        return CONFIG.API.ENVIRONMENT === 'production' 
          ? this.PRODUCTION 
          : this.LOCAL;
      }
    },
    
    // Success page URL (after payment)
    SUCCESS: {
      LOCAL: 'http://localhost:3001/success',
      PRODUCTION: 'https://crmsync.com/success',
      
      get URL() {
        return CONFIG.API.ENVIRONMENT === 'production' 
          ? this.PRODUCTION 
          : this.LOCAL;
      }
    }
  },
  
  // Feature flags
  FEATURES: {
    // Enable detailed logging (disable in production)
    DEBUG_LOGGING: CONFIG.API.ENVIRONMENT !== 'production',
    
    // Enable analytics (optional)
    ANALYTICS_ENABLED: false,
    
    // Enable error reporting (optional - Sentry, etc.)
    ERROR_REPORTING: false
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

