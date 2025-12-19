const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');

// ============================================
// GET /api/subscription/status
// Get current user's subscription details
// ============================================
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT 
        subscription_tier, 
        stripe_customer_id, 
        stripe_subscription_id, 
        subscription_status,
        subscription_expires_at,
        trial_ends_at,
        contact_limit
      FROM users 
      WHERE id = $1`,
      [userId]
    );
    
    const user = result.rows[0];
    const tier = user.subscription_tier || 'free';
    
    // Get contact count
    const contactCount = await db.query(
      'SELECT COUNT(*) as count FROM contacts WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      tier,
      status: user.subscription_status || 'active',
      stripeCustomerId: user.stripe_customer_id,
      stripeSubscriptionId: user.stripe_subscription_id,
      expiresAt: user.subscription_expires_at,
      trialEndsAt: user.trial_ends_at,
      contactLimit: user.contact_limit || 50,
      currentContactCount: parseInt(contactCount.rows[0].count),
      features: getFeaturesByTier(tier),
      canUpgrade: tier !== 'enterprise'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/subscription/details
// Get detailed subscription information including billing
// ============================================
router.get('/details', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      `SELECT 
        subscription_tier,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_expires_at,
        trial_ends_at,
        contact_limit,
        created_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );
    
    const userData = user.rows[0];
    
    // Get Stripe subscription details
    let subscriptionDetails = null;
    if (userData.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          userData.stripe_subscription_id
        );
        
        subscriptionDetails = {
          interval: subscription.items.data[0].plan.interval, // 'month' or 'year'
          intervalCount: subscription.items.data[0].plan.interval_count,
          amount: subscription.items.data[0].plan.amount / 100,
          currency: subscription.items.data[0].plan.currency.toUpperCase(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        };
      } catch (error) {
        console.error('Failed to fetch Stripe subscription:', error);
      }
    }
    
    // Get payment method
    let paymentMethod = null;
    if (userData.stripe_customer_id) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: userData.stripe_customer_id,
          type: 'card',
        });
        
        if (paymentMethods.data.length > 0) {
          const pm = paymentMethods.data[0];
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expiryMonth: pm.card.exp_month,
            expiryYear: pm.card.exp_year
          };
        }
      } catch (error) {
        console.error('Failed to fetch payment method:', error);
      }
    }
    
    res.json({
      tier: userData.subscription_tier,
      status: userData.subscription_status,
      contactLimit: userData.contact_limit,
      accountCreated: userData.created_at,
      subscription: subscriptionDetails,
      paymentMethod: paymentMethod,
      trialEndsAt: userData.trial_ends_at
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/subscription/invoices
// Get invoice history
// ============================================
router.get('/invoices', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0] || !user.rows[0].stripe_customer_id) {
      return res.json({ invoices: [] });
    }
    
    const invoices = await stripe.invoices.list({
      customer: user.rows[0].stripe_customer_id,
      limit: 10
    });
    
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      date: new Date(inv.created * 1000),
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url
    }));
    
    res.json({ invoices: formattedInvoices });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/subscription/create-portal
// Create Stripe Customer Portal session
// ============================================
router.post('/create-portal', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0] || !user.rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: user.rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'https://www.crm-sync.net'}/#/account`,
    });
    
    res.json({ url: session.url });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/subscription/create-checkout
// Create Stripe checkout session
// ============================================
router.post('/create-checkout', 
  authenticateToken,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('successUrl').optional().isURL().withMessage('Invalid success URL'),
    body('cancelUrl').optional().isURL().withMessage('Invalid cancel URL'),
    body('tier').optional().isString().withMessage('Invalid tier')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.userId; // Changed from req.user.id to match JWT payload
      const { priceId, successUrl, cancelUrl, tier } = req.body;
      
      // Determine tier from priceId if not provided
      let subscriptionTier = tier;
      if (!subscriptionTier) {
        // Map price IDs to tiers (you'll need to add your actual price IDs here)
        const priceTierMap = {
          [process.env.STRIPE_PRICE_PRO_MONTHLY]: 'pro',
          [process.env.STRIPE_PRICE_PRO_YEARLY]: 'pro',
          [process.env.STRIPE_PRICE_BUSINESS_MONTHLY]: 'business',
          [process.env.STRIPE_PRICE_BUSINESS_YEARLY]: 'business',
        };
        subscriptionTier = priceTierMap[priceId] || 'pro'; // Default to pro if unknown
      }
      
      // Get user email
      const userResult = await db.query(
        'SELECT email, stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create or retrieve Stripe customer
      let customerId = user.stripe_customer_id;
      
      // Verify customer exists in Stripe (in case of account changes)
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (err) {
          console.log('⚠️ Customer not found in Stripe, creating new one:', err.message);
          customerId = null; // Clear invalid customer ID
        }
      }
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        
        // Save customer ID
        await db.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, userId]
        );
        console.log('✅ Created new Stripe customer:', customerId);
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: userId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: successUrl || `${process.env.FRONTEND_URL}/#/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/#/pricing?cancelled=true`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: {
          userId: userId,
          priceId: priceId,
          tier: subscriptionTier  // ADD TIER HERE!
        },
        subscription_data: {
          metadata: {
            userId: userId,
            tier: subscriptionTier  // AND HERE!
          },
          trial_period_days: 14  // Optional: 14-day free trial
        }
      });
      
      res.json({ 
        sessionId: session.id, 
        url: session.url 
      });
      
    } catch (error) {
      console.error('Checkout creation error:', error);
      next(error);
    }
  }
);

// ============================================
// POST /api/subscription/create-portal
// Create Stripe customer portal session
// ============================================
router.post('/create-portal', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const userResult = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    const stripeCustomerId = userResult.rows[0]?.stripe_customer_id;
    
    if (!stripeCustomerId) {
      return res.status(400).json({ 
        error: 'No active subscription found' 
      });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/account`,
    });
    
    res.json({ url: session.url });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// NOTE: Webhook route has been moved to webhookHandler.js
// This is because it needs raw body parsing which must be
// registered before the main body parser in server.js
// ============================================

// ============================================
// Helper Functions
// ============================================

function getFeaturesByTier(tier) {
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

function getContactLimitByTier(tier) {
  const limits = {
    free: 50,
    pro: -1,
    business: -1,
    enterprise: -1
  };
  return limits[tier] || 50;
}

module.exports = router;

