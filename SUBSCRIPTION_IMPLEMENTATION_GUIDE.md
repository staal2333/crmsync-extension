# 💳 CRMSYNC Subscription System Implementation Guide

## 📋 Overview

This guide covers the complete implementation of the subscription and payment system for CRMSYNC, including:
- Backend API endpoints for subscription management
- Stripe integration for payments
- Feature gating and usage limits
- Extension UI updates for subscription tiers

---

## 🎯 Subscription Tiers

### **FREE Tier** (Guest Mode or Registered)
- 50 contact limit
- Local storage only (no cloud sync)
- 1 CSV export per week
- Community support
- Basic features only

### **PRO Tier** - $9.99/month or $99/year
- Unlimited contacts
- Cloud sync across devices
- Unlimited CSV exports
- Auto-approve contacts
- Email support
- Reminders & follow-ups

### **BUSINESS Tier** - $29.99/month or $299/year
- Everything in Pro
- Up to 5 team members
- Advanced analytics
- CRM integrations
- Priority support
- 90-day contact history

### **ENTERPRISE Tier** - Custom pricing
- Everything in Business
- Unlimited team members
- Dedicated account manager
- Custom integrations
- SLA guarantees
- Phone support

---

## 🚀 Implementation Status

### ✅ Completed Backend Changes

1. **Database Migration** (`crmsync-backend/src/migrations/002_add_subscriptions.sql`)
   - Added subscription fields to users table
   - Created subscription_events table for audit logging
   - Created usage_tracking table for quotas

2. **Subscription Routes** (`crmsync-backend/src/routes/subscription.js`)
   - `GET /api/subscription/status` - Get user's subscription details
   - `POST /api/subscription/create-checkout` - Create Stripe checkout session
   - `POST /api/subscription/create-portal` - Open Stripe customer portal
   - `POST /api/subscription/webhook` - Handle Stripe webhook events

3. **Subscription Middleware** (`crmsync-backend/src/middleware/subscriptionCheck.js`)
   - `checkContactLimit` - Enforce contact limits before adding new contacts
   - `requireFeature` - Gate features by subscription tier
   - `getFeaturesByTier` - Get available features for a tier

4. **Server Updates** (`crmsync-backend/src/server.js`)
   - Registered subscription routes
   - Webhook endpoint configured before JSON parser (required for Stripe)

5. **Contact Limit Enforcement** (`crmsync-backend/src/routes/contacts.js`)
   - Added `checkContactLimit` middleware to POST /api/contacts

### ✅ Completed Extension Changes

1. **Subscription Service** (`Saas Tool/subscriptionService.js`)
   - Centralized subscription management
   - Feature access checking
   - Local + cloud subscription status
   - Export tracking for free tier limits

2. **Background Script Updates** (`Saas Tool/background.js`)
   - Imported subscription service
   - Added message handlers for subscription actions
   - Contact limit enforcement in saveContact()
   - Upgrade notifications when limits reached

3. **Popup UI Updates**
   - **Files Modified:**
     - `Saas Tool/popup.html` - Added tier badge and contact limit display
     - `Saas Tool/popup.js` - Integrated subscription status loading
     - `Saas Tool/popup-subscription.js` - Subscription UI functions
     - `Saas Tool/popup.css` - Tier badge styles
   
   - **Features:**
     - Subscription tier badge in header
     - Contact limit display in stats
     - Upgrade banners when approaching limits
     - Upgrade dialog modals for restricted features
     - "View Plans" button to open pricing page

---

## 🔧 Setup Instructions

### Prerequisites

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Complete business verification
   - Note API keys from dashboard

2. **Node.js & PostgreSQL**
   - Node.js 16+ installed
   - PostgreSQL 12+ running

### Step 1: Database Migration

```bash
cd crmsync-backend
npm run migrate
```

This will:
- Add subscription fields to users table
- Create subscription_events table
- Create usage_tracking table

### Step 2: Install Dependencies

```bash
cd crmsync-backend
npm install stripe
```

### Step 3: Configure Environment Variables

Copy the ENV_TEMPLATE.txt to .env:

```bash
cd crmsync-backend
cp ENV_TEMPLATE.txt .env
```

Edit `.env` and add:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx  # From Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # After webhook setup

# Price IDs (create in Stripe Dashboard first)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxx

# Your website URL
FRONTEND_URL=http://localhost:3001
```

### Step 4: Create Stripe Products & Prices

1. Go to https://dashboard.stripe.com/products
2. Click "Add Product"

**Create these products:**

**Product 1: CRMSYNC Pro**
- Name: CRMSYNC Pro
- Description: Unlimited contacts with cloud sync
- Pricing:
  - Monthly: $9.99 USD (Recurring)
  - Yearly: $99.00 USD (Recurring)
- Copy the Price IDs → Add to .env

**Product 2: CRMSYNC Business**
- Name: CRMSYNC Business  
- Description: Pro + team features + analytics
- Pricing:
  - Monthly: $29.99 USD (Recurring)
  - Yearly: $299.00 USD (Recurring)
- Copy the Price IDs → Add to .env

### Step 5: Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-backend-domain.com/api/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret → Add to .env as `STRIPE_WEBHOOK_SECRET`

**Test webhook locally:**

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/subscription/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

### Step 6: Start Backend Server

```bash
cd crmsync-backend
npm run dev
```

Verify endpoints:
- http://localhost:3000/health
- http://localhost:3000/api/subscription/status (requires auth)

### Step 7: Update Extension Configuration

**File:** `Saas Tool/subscriptionService.js`

Update the API base URL:

```javascript
const API_BASE_URL = 'https://your-backend-domain.com';
```

And update the pricing page URL:

```javascript
openPricingPage() {
  chrome.tabs.create({
    url: 'https://your-website.com/pricing'
  });
}
```

### Step 8: Test the Integration

1. **Load Extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked → Select "Saas Tool" folder

2. **Test Free Tier Limits**
   - Use extension in guest mode
   - Add 50 contacts
   - Try to add 51st contact → Should see upgrade prompt

3. **Test Upgrade Flow**
   - Click "View Plans" button
   - Should redirect to pricing page

4. **Test Backend Subscription Check**
   ```bash
   # Register a user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test123!","displayName":"Test User"}'
   
   # Login and get token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test123!"}'
   
   # Check subscription status
   curl http://localhost:3000/api/subscription/status \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

---

## 🎨 Creating a Pricing Page

You need a landing page/website with:
1. Homepage with extension overview
2. Pricing page with tier comparison
3. Success page after checkout
4. Account page for managing subscription

**Recommended Tech Stack:**
- **Next.js** + Tailwind CSS + Stripe
- **Vercel** for hosting (free)
- Domain from Namecheap/GoDaddy ($12/year)

**Quick Start with Next.js:**

```bash
npx create-next-app@latest crmsync-website
cd crmsync-website
npm install @stripe/stripe-js stripe
```

**Create pricing page** (`pages/pricing.js`):

```jsx
import { useState } from 'react';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  
  const handleUpgrade = async (tier) => {
    const response = await fetch('https://your-backend.com/api/subscription/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ tier, billingPeriod })
    });
    
    const { url } = await response.json();
    window.location.href = url;
  };
  
  return (
    <div className="pricing-page">
      {/* Tier cards with pricing */}
      <button onClick={() => handleUpgrade('pro')}>
        Upgrade to Pro
      </button>
    </div>
  );
}
```

---

## 📊 Testing Checklist

### Backend Tests

- [ ] Database migration runs successfully
- [ ] Subscription status endpoint returns correct data
- [ ] Create checkout session generates Stripe URL
- [ ] Webhook signature verification works
- [ ] Contact limit enforcement blocks at 50 for free tier
- [ ] Contact limit is unlimited (-1) for Pro+ tiers

### Extension Tests

- [ ] Subscription service loads correctly
- [ ] Tier badge displays in popup
- [ ] Contact limit shows in stats (e.g., "45 / 50")
- [ ] Upgrade banner appears when > 80% of limit
- [ ] Upgrade modal shows when trying restricted feature
- [ ] "View Plans" button opens pricing page
- [ ] Contact addition blocked at limit with notification

### Stripe Tests

- [ ] Test checkout with card: 4242 4242 4242 4242
- [ ] Payment succeeds and webhook fires
- [ ] User subscription_tier updated in database
- [ ] Extension reflects new tier after refresh
- [ ] Contact limit changes to unlimited
- [ ] Customer portal opens correctly
- [ ] Subscription cancellation downgrades to free

---

## 🔒 Security Checklist

Before going live:

- [ ] Use Stripe live keys (not test keys)
- [ ] Webhook secret configured correctly
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on backend
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled on all endpoints
- [ ] JWT secrets are strong random values
- [ ] Environment variables not committed to git
- [ ] Database uses SSL/TLS connections
- [ ] Error messages don't leak sensitive data

---

## 🐛 Troubleshooting

### "Webhook signature verification failed"
**Solution:** Ensure STRIPE_WEBHOOK_SECRET in .env matches the secret from Stripe Dashboard

### "Contact limit not enforced"
**Solution:** Check that `checkContactLimit` middleware is applied to POST /api/contacts route

### "Subscription status shows 'free' for paid users"
**Solution:** Verify webhook is firing and updating users table. Check subscription_events table for webhook logs

### "Extension can't fetch subscription status"
**Solution:** Check CORS configuration in backend. Ensure chrome-extension:// origins are allowed

### "TypeError: subscriptionService is not defined"
**Solution:** Verify `importScripts('subscriptionService.js')` is at top of background.js

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rates**
   - Free → Pro conversion %
   - Trial → Paid conversion %
   - Monthly → Annual conversion %

2. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Average Revenue Per User (ARPU)
   - Churn rate

3. **Usage Metrics**
   - Average contacts per free user
   - % of free users hitting limit
   - Features used by tier
   - Export frequency

4. **Subscription Events**
   - New subscriptions
   - Cancellations
   - Failed payments
   - Upgrades/downgrades

### Stripe Dashboard

Monitor in real-time:
- https://dashboard.stripe.com/dashboard
- https://dashboard.stripe.com/subscriptions
- https://dashboard.stripe.com/payments

---

## 🚀 Next Steps

### Phase 1: MVP (Current)
- ✅ Subscription tiers defined
- ✅ Backend API implemented
- ✅ Extension UI updated
- ⏳ Create pricing page
- ⏳ Set up Stripe products
- ⏳ Configure webhooks

### Phase 2: Launch
- [ ] Deploy backend to production
- [ ] Deploy website to Vercel
- [ ] Submit extension to Chrome Web Store
- [ ] Add terms of service & privacy policy
- [ ] Set up error monitoring (Sentry)
- [ ] Create onboarding flow

### Phase 3: Optimize
- [ ] A/B test pricing
- [ ] Add referral program
- [ ] Implement 14-day free trial
- [ ] Email drip campaigns
- [ ] Usage analytics dashboard
- [ ] Customer feedback system

---

## 📞 Support

If you encounter issues:

1. Check the webhook logs in Stripe Dashboard
2. Check subscription_events table in database
3. Check browser console for extension errors
4. Check backend logs for API errors
5. Test with Stripe test cards: https://stripe.com/docs/testing

---

## 📚 Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Chrome Extension Development:** https://developer.chrome.com/docs/extensions/
- **Next.js Documentation:** https://nextjs.org/docs

---

**Last Updated:** December 16, 2025  
**Implementation Status:** Core Complete - Ready for Stripe Setup  
**Version:** 2.0.0

