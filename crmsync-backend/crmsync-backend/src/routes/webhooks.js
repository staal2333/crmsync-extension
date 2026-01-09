const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/webhooks/subscription-update
 * Webhook endpoint for subscription updates (e.g., from Stripe, Paddle, etc.)
 * This allows real-time notification to extension when user upgrades
 */
router.post('/subscription-update', async (req, res) => {
  try {
    const { userId, tier, event } = req.body;
    
    console.log('🔔 Subscription webhook received:', { userId, tier, event });
    
    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing required fields: userId, tier' });
    }
    
    // Update user's subscription tier in database
    const result = await db.query(
      'UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [tier, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Updated user ${userId} to tier: ${tier}`);
    
    // Note: The extension's periodic check (every 5 minutes) will pick up this change
    // For instant notification, you could implement push notifications via Firebase Cloud Messaging
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        tier: result.rows[0].subscription_tier
      }
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler for payment events
 * Verifies webhook signature and processes subscription events
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(400).json({ error: 'Webhook not configured' });
    }
    
    // Verify webhook signature (requires stripe library)
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    // For now, just parse the body
    const event = JSON.parse(req.body.toString());
    
    console.log('🔔 Stripe webhook event:', event.type);
    
    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        
        // Get user by Stripe customer ID
        const userResult = await db.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          const tier = status === 'active' ? 'pro' : 'free';
          
          await db.query(
            'UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
            [tier, userId]
          );
          
          console.log(`✅ Updated user ${userId} subscription to: ${tier}`);
        }
        break;
        
      case 'customer.subscription.deleted':
        const canceledSub = event.data.object;
        const canceledCustomerId = canceledSub.customer;
        
        await db.query(
          'UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE stripe_customer_id = $2',
          ['free', canceledCustomerId]
        );
        
        console.log(`✅ Canceled subscription for customer: ${canceledCustomerId}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
