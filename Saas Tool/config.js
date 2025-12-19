// Configuration for CRMSYNC Extension
const CONFIG = {
  // Your website URL
  WEBSITE_URL: 'https://www.crm-sync.net',
  
  // Backend API URL
  API_URL: 'https://crmsync-api.onrender.com/api',
  
  // Auth endpoints (using hash-based routing)
  AUTH: {
    LOGIN: '/#/login',
    SIGNUP: '/#/signup',
    PRICING: '/#/pricing',
    CALLBACK: '/auth/extension-callback'
  },
  
  // Feature limits by tier
  TIERS: {
    free: {
      name: 'Free',
      contactLimit: 50,
      exportLimit: 10,
      features: [
        'Extract up to 50 contacts',
        'Export 10 contacts per month',
        'Basic contact management'
      ]
    },
    pro: {
      name: 'Pro',
      contactLimit: 1000,
      exportLimit: -1, // -1 = unlimited
      features: [
        'Extract up to 1,000 contacts',
        'Unlimited exports',
        'Advanced analytics',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      contactLimit: -1, // -1 = unlimited
      exportLimit: -1,
      features: [
        'Unlimited contacts',
        'Unlimited exports',
        'Team collaboration',
        'API access',
        'Dedicated support'
      ]
    }
  }
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
