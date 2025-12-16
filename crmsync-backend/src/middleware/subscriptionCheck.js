const db = require('../config/database');

/**
 * Middleware to check if user has access to a feature
 */
function requireFeature(featureName) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await db.query(
        'SELECT subscription_tier FROM users WHERE id = $1',
        [userId]
      );
      
      const tier = result.rows[0]?.subscription_tier || 'free';
      const features = getFeaturesByTier(tier);
      
      if (!features[featureName]) {
        return res.status(403).json({
          error: 'Feature not available',
          feature: featureName,
          currentTier: tier,
          upgradeRequired: true,
          upgradeUrl: `${process.env.FRONTEND_URL || 'https://crmsync.com'}/pricing`
        });
      }
      
      req.userTier = tier;
      req.userFeatures = features;
      next();
      
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check contact limit before adding new contacts
 */
async function checkContactLimit(req, res, next) {
  try {
    const userId = req.user.id;
    
    const userResult = await db.query(
      'SELECT subscription_tier, contact_limit FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    const limit = user.contact_limit || 50;
    
    // -1 means unlimited
    if (limit === -1) {
      return next();
    }
    
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM contacts WHERE user_id = $1',
      [userId]
    );
    
    const currentCount = parseInt(countResult.rows[0].count);
    
    if (currentCount >= limit) {
      return res.status(403).json({
        error: 'Contact limit reached',
        currentCount,
        limit,
        tier: user.subscription_tier,
        upgradeRequired: true,
        upgradeUrl: `${process.env.FRONTEND_URL || 'https://crmsync.com'}/pricing`,
        message: `You've reached your contact limit of ${limit}. Upgrade to Pro for unlimited contacts.`
      });
    }
    
    next();
    
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check rate limits based on subscription tier
 */
function checkApiRateLimit(req, res, next) {
  // This would integrate with the existing rate limiter
  // based on subscription tier
  // For now, just pass through
  next();
}

/**
 * Get features available for a given tier
 */
function getFeaturesByTier(tier) {
  const features = {
    free: {
      cloudSync: false,
      reminders: false,
      autoApprove: false,
      bulkActions: false,
      apiAccess: false,
      advancedAnalytics: false,
      crmIntegrations: false
    },
    pro: {
      cloudSync: true,
      reminders: true,
      autoApprove: true,
      bulkActions: true,
      apiAccess: true,
      advancedAnalytics: false,
      crmIntegrations: false
    },
    business: {
      cloudSync: true,
      reminders: true,
      autoApprove: true,
      bulkActions: true,
      apiAccess: true,
      advancedAnalytics: true,
      crmIntegrations: true
    },
    enterprise: {
      cloudSync: true,
      reminders: true,
      autoApprove: true,
      bulkActions: true,
      apiAccess: true,
      advancedAnalytics: true,
      crmIntegrations: true,
      customIntegrations: true
    }
  };
  
  return features[tier] || features.free;
}

module.exports = {
  requireFeature,
  checkContactLimit,
  checkApiRateLimit,
  getFeaturesByTier
};

