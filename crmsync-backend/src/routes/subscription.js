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
// POST /api/subscription/create-checkout
// Create Stripe checkout session
// ============================================
router.post('/create-checkout', 
  authenticateToken,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('successUrl').optional().isURL().withMessage('Invalid success URL'),
    body('cancelUrl').optional().isURL().withMessage('Invalid cancel URL')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.userId; // Changed from req.user.id to match JWT payload
      const { priceId, successUrl, cancelUrl } = req.body;
      
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
          priceId: priceId
        },
        subscription_data: {
          metadata: {
            userId: userId
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
// POST /api/subscription/webhook
// Handle Stripe webhook events
// ============================================
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`✅ Webhook received: ${event.type}`);
    
    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data.object);
          break;
          
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Log event
      await logSubscriptionEvent(event);
      
      res.json({ received: true });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// ============================================
// Helper Functions
// ============================================

async function handleCheckoutComplete(session) {
  const userId = session.client_reference_id || session.metadata.userId;
  const tier = session.metadata.tier;
  
  console.log(`💰 Checkout completed for user ${userId}, tier: ${tier}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = $1,
      stripe_subscription_id = $2,
      subscription_status = 'active',
      contact_limit = $3
    WHERE id = $4`,
    [tier, session.subscription, getContactLimitByTier(tier), userId]
  );
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier;
  
  console.log(`🎉 Subscription created for user ${userId}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = $1,
      stripe_subscription_id = $2,
      subscription_status = $3,
      trial_ends_at = $4,
      contact_limit = $5
    WHERE id = $6`,
    [
      tier, 
      subscription.id, 
      subscription.status,
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      getContactLimitByTier(tier),
      userId
    ]
  );
}

async function handleSubscriptionUpdated(subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_status = $1,
      subscription_expires_at = $2
    WHERE stripe_subscription_id = $3`,
    [
      subscription.status,
      subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      subscription.id
    ]
  );
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = 'free',
      subscription_status = 'cancelled',
      contact_limit = 50
    WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
}

async function handlePaymentSucceeded(invoice) {
  console.log(`✅ Payment succeeded: ${invoice.id}`);
  // Optional: Send receipt email, update payment history, etc.
}

async function handlePaymentFailed(invoice) {
  console.log(`⚠️  Payment failed: ${invoice.id}`);
  // Optional: Send dunning email, notify user, etc.
}

async function logSubscriptionEvent(event) {
  try {
    await db.query(
      `INSERT INTO subscription_events (user_id, event_type, stripe_event_id, data)
       VALUES ($1, $2, $3, $4)`,
      [
        event.data.object.metadata?.userId || null,
        event.type,
        event.id,
        JSON.stringify(event.data.object)
      ]
    );
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

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

