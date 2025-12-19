const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

// ============================================
// POST /api/subscription/webhook
// Handle Stripe webhook events
// Note: Raw body parsing is done in server.js before this route
// ============================================
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    // req.body is already a raw buffer from express.raw() in server.js
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
});

// ============================================
// Helper Functions
// ============================================

async function handleCheckoutComplete(session) {
  const userId = session.client_reference_id || session.metadata.userId;
  const tier = session.metadata.tier;
  
  console.log(`💰 Checkout completed for user ${userId}, tier: ${tier}`);
  
  if (!userId || !tier) {
    console.error('❌ Missing userId or tier in checkout session metadata');
    return;
  }
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = $1,
      stripe_customer_id = $2,
      stripe_subscription_id = $3,
      subscription_status = 'active',
      contact_limit = $4,
      updated_at = NOW()
    WHERE id = $5`,
    [tier, session.customer, session.subscription, getContactLimitByTier(tier), userId]
  );
  
  console.log(`✅ User ${userId} upgraded to ${tier}`);
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier;
  
  console.log(`🎉 Subscription created for user ${userId}`);
  
  if (!userId || !tier) {
    console.error('❌ Missing userId or tier in subscription metadata');
    return;
  }
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = $1,
      stripe_subscription_id = $2,
      subscription_status = $3,
      contact_limit = $4,
      trial_ends_at = $5,
      updated_at = NOW()
    WHERE id = $6`,
    [
      tier,
      subscription.id,
      subscription.status,
      getContactLimitByTier(tier),
      subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      userId
    ]
  );
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier;
  
  console.log(`🔄 Subscription updated for user ${userId}`);
  
  if (!userId) {
    // Try to find user by stripe_subscription_id
    const result = await db.query(
      'SELECT id FROM users WHERE stripe_subscription_id = $1',
      [subscription.id]
    );
    
    if (result.rows.length === 0) {
      console.error('❌ User not found for subscription:', subscription.id);
      return;
    }
    
    userId = result.rows[0].id;
  }
  
  await db.query(
    `UPDATE users SET 
      subscription_status = $1,
      subscription_tier = $2,
      contact_limit = $3,
      updated_at = NOW()
    WHERE id = $4`,
    [
      subscription.status,
      tier || 'free',
      tier ? getContactLimitByTier(tier) : 50,
      userId
    ]
  );
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`🚫 Subscription deleted: ${subscription.id}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_tier = 'free',
      subscription_status = 'canceled',
      contact_limit = 50,
      stripe_subscription_id = NULL,
      updated_at = NOW()
    WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
}

async function handlePaymentSucceeded(invoice) {
  console.log(`💵 Payment succeeded for invoice: ${invoice.id}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_status = 'active',
      updated_at = NOW()
    WHERE stripe_customer_id = $1`,
    [invoice.customer]
  );
}

async function handlePaymentFailed(invoice) {
  console.log(`⚠️  Payment failed for invoice: ${invoice.id}`);
  
  await db.query(
    `UPDATE users SET 
      subscription_status = 'past_due',
      updated_at = NOW()
    WHERE stripe_customer_id = $1`,
    [invoice.customer]
  );
}

async function logSubscriptionEvent(event) {
  try {
    await db.query(
      `INSERT INTO subscription_events (event_id, event_type, event_data, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [event.id, event.type, JSON.stringify(event.data.object)]
    );
  } catch (error) {
    // Table might not exist, that's ok
    console.log('Note: subscription_events table not found, skipping event log');
  }
}

function getContactLimitByTier(tier) {
  const limits = {
    free: 50,
    pro: -1,        // unlimited
    business: -1,   // unlimited
    enterprise: -1  // unlimited
  };
  return limits[tier.toLowerCase()] || 50;
}

module.exports = router;
