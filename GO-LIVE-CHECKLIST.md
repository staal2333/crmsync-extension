# 🚀 GO LIVE CHECKLIST - Stripe Production Mode

## ⚠️ IMPORTANT: Read This First!

Going live means:
- ✅ Real customers can pay you
- ✅ Real money will be deposited to your bank account
- ⚠️ Test cards will NO LONGER WORK
- ⚠️ You'll need a real card to test

**Estimated Time:** 20 minutes

---

## 📋 Pre-Launch Checklist

Before switching to live mode, ensure:
- [ ] Stripe account fully activated
- [ ] Bank account connected to Stripe
- [ ] Business details verified in Stripe
- [ ] Tax settings configured (if applicable)
- [ ] Extension tested thoroughly with test keys
- [ ] Backend is stable and monitored

---

## STEP 1: Activate Stripe Live Mode (5 min)

### 1.1 Complete Stripe Account Setup

1. Go to: https://dashboard.stripe.com/account/onboarding
2. Complete all required steps:
   - ✅ Business details
   - ✅ Bank account (for payouts)
   - ✅ Identity verification
   - ✅ Tax information (if in US)

### 1.2 Switch to Live Mode

1. In Stripe Dashboard, top-left corner
2. Toggle switch from **"Test mode"** to **"Live mode"**
3. You should see: "Viewing live data"

---

## STEP 2: Get Live API Keys (2 min)

### 2.1 Get Secret Key

1. Go to: https://dashboard.stripe.com/apikeys
2. Make sure you're in **Live mode** (check top-left)
3. Copy **Secret key** (starts with `sk_live_...`)
   - Click "Reveal live key token"
   - Copy the full key
   - ⚠️ **NEVER share this publicly!**

### 2.2 Store Safely

**DO NOT:**
- ❌ Put in extension code
- ❌ Commit to GitHub
- ❌ Share publicly

**DO:**
- ✅ Add to Render environment variables only

---

## STEP 3: Create Live Products & Prices (5 min)

### 3.1 Create Pro Plan Product

1. Go to: https://dashboard.stripe.com/products
2. Make sure you're in **Live mode**
3. Click **"Add product"**
4. Fill in:
   ```
   Name: CRMSYNC Pro
   Description: Unlimited contacts, cloud sync, and premium features
   ```

### 3.2 Create Monthly Price

5. Add pricing:
   ```
   Price: $9.99
   Billing period: Monthly
   Currency: USD (or your currency)
   ```
6. Click **"Save product"**
7. **COPY THE PRICE ID** (e.g., `price_1LIVE123xyz`)
   - Click on the price
   - Copy the ID starting with `price_`

### 3.3 Create Yearly Price (Optional)

8. Click **"Add another price"**
9. Fill in:
   ```
   Price: $99
   Billing period: Yearly
   Currency: USD
   ```
10. Click **"Save"**
11. **COPY THE YEARLY PRICE ID**

---

## STEP 4: Update Extension with Live Price IDs (2 min)

### 4.1 Edit payment.js

1. Open: `Saas Tool/payment.js`
2. Find line 8:
   ```javascript
   const STRIPE_PRICE_IDS = {
     PRO_MONTHLY: 'price_1234567890abcdefg', // OLD TEST ID
     PRO_YEARLY: 'price_0987654321fedcba',   // OLD TEST ID
   };
   ```

3. Replace with your LIVE Price IDs:
   ```javascript
   const STRIPE_PRICE_IDS = {
     PRO_MONTHLY: 'price_1LIVE123xyz', // 👈 Your live monthly price ID
     PRO_YEARLY: 'price_1LIVE456xyz',  // 👈 Your live yearly price ID
   };
   ```

4. **Save the file**

---

## STEP 5: Update Backend Environment Variables (3 min)

### 5.1 Go to Render Dashboard

1. Go to: https://dashboard.render.com/
2. Select your backend service: `crmsync-backend`
3. Click **"Environment"** tab

### 5.2 Update Stripe Keys

Replace these environment variables:

#### Before (Test):
```env
STRIPE_SECRET_KEY=sk_test_51ABC...XYZ
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PRICE_PRO_MONTHLY=price_test123
STRIPE_PRICE_PRO_YEARLY=price_test456
```

#### After (Live):
```env
STRIPE_SECRET_KEY=sk_live_51ABC...XYZ  👈 CHANGE THIS!
STRIPE_WEBHOOK_SECRET=whsec_...         👈 CHANGE THIS (next step)
STRIPE_PRICE_PRO_MONTHLY=price_1LIVE123xyz  👈 CHANGE THIS!
STRIPE_PRICE_PRO_YEARLY=price_1LIVE456xyz   👈 CHANGE THIS!
```

### 5.3 Save Changes

1. Click **"Save Changes"**
2. Render will redeploy your backend (takes 2-3 minutes)
3. Wait for deployment to complete

---

## STEP 6: Create Live Webhook (3 min)

### 6.1 Delete Test Webhook (Optional)

1. Go to: https://dashboard.stripe.com/webhooks
2. Find your test webhook
3. Click **"Delete"** (optional, or just disable it)

### 6.2 Create Live Webhook

1. Make sure you're in **Live mode**
2. Click **"Add endpoint"**
3. Fill in:
   ```
   Endpoint URL:
   https://crmsync-api.onrender.com/api/subscription/webhook
   
   Description: CRMSYNC Production Webhook
   ```

4. Click **"Select events"**
5. Check these 6 events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

6. Click **"Add endpoint"**

### 6.3 Get Webhook Signing Secret

7. Click on your new webhook
8. Scroll to **"Signing secret"**
9. Click **"Reveal"**
10. **COPY** the secret (starts with `whsec_`)

### 6.4 Update Render Environment

11. Go back to Render dashboard
12. Update `STRIPE_WEBHOOK_SECRET` with the new live secret
13. Click **"Save Changes"**
14. Wait for redeploy

---

## STEP 7: Reload Extension (1 min)

### 7.1 Reload in Chrome

1. Go to: `chrome://extensions`
2. Find **CRMSYNC**
3. Click the reload icon 🔄
4. Extension is now using live Price IDs!

---

## STEP 8: Test with Real Card (5 min)

### 8.1 Make a Test Purchase

⚠️ **WARNING:** This will charge your real card!

1. Open extension popup
2. Sign out (if signed in)
3. Create a new test account (optional, or use existing)
4. Click **"✨ Upgrade to Pro"**
5. Enter **real card details**:
   ```
   Card number: Your real card
   Expiry: MM/YY
   CVC: XXX
   ZIP: XXXXX
   ```
6. Click **"Subscribe"**

### 8.2 Verify Success

Check that:
- ✅ Payment succeeds
- ✅ Success page shows
- ✅ Extension reloads
- ✅ Badge changes to "PRO"
- ✅ Contact limit = "Unlimited"

### 8.3 Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/payments
2. You should see the payment
3. Status: "Succeeded"
4. Amount: $9.99 (or your price)

### 8.4 Check Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click your webhook
3. Check **"Events"** tab
4. You should see recent events (green checkmarks)

### 8.5 Check Backend Logs

1. Go to: https://dashboard.render.com/
2. Click your backend service
3. View **"Logs"** tab
4. Look for:
   ```
   ✅ Webhook received: checkout.session.completed
   💰 Checkout completed for user 123, tier: pro
   ✅ User 123 upgraded to pro
   ```

---

## STEP 9: Cancel Test Subscription (Optional)

If you don't want to pay $9.99/month:

### 9.1 Open Customer Portal

1. In extension, click **"💳 Manage Billing"**
2. Stripe Customer Portal opens
3. Click **"Cancel plan"**
4. Confirm cancellation

### 9.2 Or Cancel in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/subscriptions
2. Find your test subscription
3. Click **"Cancel subscription"**

---

## STEP 10: Final Checks ✅

### 10.1 Security Checklist

- [ ] Live API keys are ONLY in Render environment variables
- [ ] No API keys in extension code
- [ ] No API keys in GitHub
- [ ] Webhook signing secret is correct
- [ ] HTTPS is enforced everywhere

### 10.2 Functionality Checklist

- [ ] Extension extracts contacts correctly
- [ ] Upgrade button opens Stripe Checkout
- [ ] Payment processing works
- [ ] Webhooks update user tier
- [ ] Extension syncs tier automatically
- [ ] Manage Billing button works
- [ ] Customer Portal allows cancellation

### 10.3 User Experience Checklist

- [ ] Free tier shows upgrade prompts
- [ ] Pro tier hides upgrade buttons
- [ ] Contact limits work correctly
- [ ] UI looks professional
- [ ] No console errors

---

## 🎉 YOU'RE LIVE!

Congratulations! Your extension is now accepting real payments!

### What Happens Now:

1. **Users can upgrade to Pro**
   - Real credit cards only
   - Instant tier upgrades
   - Automatic renewals

2. **You receive payouts**
   - Stripe deposits to your bank account
   - Usually 2-7 business days
   - Configurable payout schedule

3. **Webhooks keep everything in sync**
   - Automatic tier updates
   - Handles subscription changes
   - Logs all events

---

## 📊 Monitor Your Business

### Stripe Dashboard:
- **Payments:** https://dashboard.stripe.com/payments
- **Customers:** https://dashboard.stripe.com/customers
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Analytics:** https://dashboard.stripe.com/revenue

### Render Dashboard:
- **Logs:** Monitor backend activity
- **Metrics:** Check performance
- **Alerts:** Set up notifications

---

## 🚨 Troubleshooting

### Payment Fails
1. Check Stripe Dashboard for error message
2. Verify live keys are correct
3. Check webhook is receiving events
4. View backend logs for errors

### Tier Not Updating
1. Check webhook events in Stripe
2. Verify webhook secret is correct
3. Check backend logs
4. Verify database connection

### Extension Shows Wrong Tier
1. Sign out and sign in again
2. Clear extension storage
3. Reload extension
4. Check `/api/auth/me` response

---

## 💰 Next Steps

### Grow Your Business:
1. **Marketing:**
   - Launch marketing website
   - Write blog posts
   - Social media promotion
   - Product Hunt launch

2. **Features:**
   - Add yearly plan discount
   - Create Business tier
   - Add team features
   - Build mobile app

3. **Analytics:**
   - Track conversion rates
   - Monitor churn
   - A/B test pricing
   - Collect user feedback

4. **Support:**
   - Set up help desk
   - Create FAQ
   - Email templates
   - Onboarding flow

---

## 🎊 Summary

**You've successfully:**
- ✅ Switched to Stripe Live Mode
- ✅ Created live products & prices
- ✅ Updated all API keys
- ✅ Configured live webhook
- ✅ Tested with real payment
- ✅ Extension is production-ready

**Your SaaS is LIVE and ready to make money!** 💰🚀

---

## 📞 Need Help?

- **Stripe Support:** https://support.stripe.com/
- **Stripe Status:** https://status.stripe.com/
- **Render Support:** https://render.com/support

**Good luck with your launch!** 🎉🚀💰
