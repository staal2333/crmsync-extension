/**
 * CRMSYNC Subscription Service
 * Handles subscription status checking, feature gating, and upgrade prompts
 */

// Import configuration (or define inline for service worker compatibility)
const API_CONFIG = {
  LOCAL: 'http://localhost:3000',
  PRODUCTION: 'https://www.crm-sync.net', // Your production API URL
  ENVIRONMENT: 'production' // Change to 'local' for development
};

const API_BASE_URL = API_CONFIG.ENVIRONMENT === 'production' 
  ? API_CONFIG.PRODUCTION 
  : API_CONFIG.LOCAL;

class SubscriptionService {
  constructor() {
    this.cachedSubscription = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current subscription status
   * @param {boolean} forceRefresh - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscriptionStatus(forceRefresh = false) {
    // Return cached if valid
    if (!forceRefresh && this.cachedSubscription && Date.now() < this.cacheExpiry) {
      return this.cachedSubscription;
    }

    const authState = await chrome.storage.local.get(['isAuthenticated', 'user']);

    // Guest mode = free tier
    if (!authState.isAuthenticated) {
      const localSub = await this.getLocalSubscriptionStatus();
      return localSub;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${authState.user.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const subscription = await response.json();
      
      // Cache the result
      this.cachedSubscription = subscription;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      // Store in local storage for offline access
      await chrome.storage.local.set({ subscription });

      return subscription;

    } catch (error) {
      console.error('Error fetching subscription:', error);
      
      // Fallback to cached in storage
      const stored = await chrome.storage.local.get(['subscription']);
      if (stored.subscription) {
        return stored.subscription;
      }

      return this.getFreeTierStatus();
    }
  }

  /**
   * Get local subscription status for guest mode users
   */
  async getLocalSubscriptionStatus() {
    const contacts = await chrome.storage.local.get(['contacts']);
    const contactList = contacts.contacts || [];
    
    return {
      tier: 'free',
      status: 'active',
      contactLimit: 50,
      currentContactCount: contactList.length,
      features: this.getFeaturesByTier('free'),
      canUpgrade: true,
      isGuestMode: true
    };
  }

  /**
   * Check if user can perform an action
   * @param {string} action - Action to check (add_contact, cloud_sync, etc.)
   * @returns {Promise<Object>} { allowed: boolean, reason: string, upgradeRequired: boolean }
   */
  async canPerformAction(action) {
    const sub = await this.getSubscriptionStatus();
    const features = sub.features || {};

    switch (action) {
      case 'add_contact':
        if (sub.contactLimit !== -1 && sub.currentContactCount >= sub.contactLimit) {
          return {
            allowed: false,
            reason: `You've reached your contact limit of ${sub.contactLimit}`,
            upgradeRequired: true,
            currentCount: sub.currentContactCount,
            limit: sub.contactLimit
          };
        }
        return { allowed: true };

      case 'cloud_sync':
        return {
          allowed: features.cloudSync === true,
          reason: features.cloudSync ? null : 'Cloud sync requires Pro tier or higher',
          upgradeRequired: !features.cloudSync
        };

      case 'reminders':
        return {
          allowed: features.reminders === true,
          reason: features.reminders ? null : 'Reminders require Pro tier or higher',
          upgradeRequired: !features.reminders
        };

      case 'auto_approve':
        return {
          allowed: features.autoApprove === true,
          reason: features.autoApprove ? null : 'Auto-approve requires Pro tier or higher',
          upgradeRequired: !features.autoApprove
        };

      case 'bulk_actions':
        return {
          allowed: features.bulkActions === true,
          reason: features.bulkActions ? null : 'Bulk actions require Pro tier or higher',
          upgradeRequired: !features.bulkActions
        };

      case 'csv_export':
        // Check weekly limit for free tier
        if (sub.tier === 'free' && features.csvExportsPerWeek !== -1) {
          const exports = await this.getExportCountThisWeek();
          if (exports >= features.csvExportsPerWeek) {
            return {
              allowed: false,
              reason: 'Weekly export limit reached (1 per week on Free tier)',
              upgradeRequired: true
            };
          }
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  /**
   * Show upgrade prompt
   */
  async showUpgradePrompt(reason, action) {
    const sub = await this.getSubscriptionStatus();
    
    chrome.runtime.sendMessage({
      type: 'SHOW_UPGRADE_MODAL',
      data: {
        currentTier: sub.tier,
        reason,
        action,
        contactCount: sub.currentContactCount,
        contactLimit: sub.contactLimit
      }
    });
  }

  /**
   * Open pricing page
   */
  openPricingPage() {
    const PRICING_URL = API_CONFIG.ENVIRONMENT === 'production'
      ? 'https://crm-sync.vercel.app/#/pricing'
      : 'http://localhost:3001/pricing';
      
    chrome.tabs.create({
      url: PRICING_URL
    });
  }

  /**
   * Get features by tier
   */
  getFeaturesByTier(tier) {
    const features = {
      free: {
        maxContacts: 50,
        cloudSync: false,
        reminders: false,
        csvExportsPerWeek: 1,
        autoApprove: false,
        bulkActions: false,
        apiAccess: false,
        support: 'community'
      },
      pro: {
        maxContacts: -1,
        cloudSync: true,
        reminders: true,
        csvExportsPerWeek: -1,
        autoApprove: true,
        bulkActions: true,
        apiAccess: true,
        apiRateLimit: 10,
        support: 'email'
      },
      business: {
        maxContacts: -1,
        cloudSync: true,
        reminders: true,
        csvExportsPerWeek: -1,
        autoApprove: true,
        bulkActions: true,
        apiAccess: true,
        apiRateLimit: 100,
        teamMembers: 5,
        advancedAnalytics: true,
        crmIntegrations: true,
        support: 'priority'
      },
      enterprise: {
        maxContacts: -1,
        cloudSync: true,
        reminders: true,
        csvExportsPerWeek: -1,
        autoApprove: true,
        bulkActions: true,
        apiAccess: true,
        apiRateLimit: 1000,
        teamMembers: -1,
        advancedAnalytics: true,
        crmIntegrations: true,
        customIntegrations: true,
        dedicatedSupport: true,
        support: 'phone'
      }
    };
    
    return features[tier] || features.free;
  }

  /**
   * Free tier default status
   */
  getFreeTierStatus() {
    return {
      tier: 'free',
      status: 'active',
      contactLimit: 50,
      currentContactCount: 0,
      features: this.getFeaturesByTier('free'),
      canUpgrade: true
    };
  }

  /**
   * Track CSV export for weekly limit
   */
  async trackExport() {
    const exports = await chrome.storage.local.get(['csvExports']);
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    let exportLog = exports.csvExports || [];
    
    // Filter to only this week
    exportLog = exportLog.filter(timestamp => timestamp > weekAgo);
    
    // Add current export
    exportLog.push(now);

    await chrome.storage.local.set({ csvExports: exportLog });
  }

  /**
   * Get export count this week
   */
  async getExportCountThisWeek() {
    const exports = await chrome.storage.local.get(['csvExports']);
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    let exportLog = exports.csvExports || [];
    exportLog = exportLog.filter(timestamp => timestamp > weekAgo);

    return exportLog.length;
  }

  /**
   * Invalidate cache (call after subscription change)
   */
  invalidateCache() {
    this.cachedSubscription = null;
    this.cacheExpiry = null;
  }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();

