# 🧪 Live Stripe Testing Guide

## Pre-Test Checklist

Before testing, verify these are set on Render:

### Environment Variables on Render:
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (LIVE key, not test!)
- [ ] `STRIPE_PRICE_PRO_MONTHLY` = `price_1LIVE...` (your live price ID)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from live webhook)

### Extension Code:
- [ ] `Saas Tool/payment.js` line 8 has your LIVE price IDs
- [ ] Extension reloaded in Chrome

---

## Test 1: Render Deployment (1 min)

1. Go to: https://dashboard.render.com/
2. Find your backend service
3. Check status: Should show **"Live"** (green)
4. Click "Logs" tab
5. Look for: `CRMSYNC API SERVER RUNNING`

**Status:** ✅ / ❌

---

## Test 2: Webhook Endpoint (1 min)

1. Open browser
2. Go to: https://crmsync-api.onrender.com/api/subscription/webhook
3. You should see JSON response:
   ```json
   {
     "status": "ok",
     "message": "CRMSYNC Webhook Endpoint",
     ...
   }
   ```

**Status:** ✅ / ❌

---

## Test 3: Extension Upgrade Flow (5 min)

⚠️ **WARNING: This will charge your real credit card!**

### Step 1: Open Extension
1. Click CRMSYNC extension icon
2. Open popup

### Step 2: Trigger Upgrade
1. Click **"✨ Upgrade to Pro"** button
2. A new tab should open

### Step 3: Verify Stripe Page
1. Check URL starts with: `https://checkout.stripe.com/`
2. Should show:
   - Product: "CRMSYNC Pro"
   - Price: $9.99/month (or your price)
   - **Live mode indicator** (not test mode!)

**Status:** ✅ / ❌

---

## Test 4: Complete Payment (Optional)

⚠️ **REAL CHARGE - Skip if you don't want to pay**

### If you want to test the full flow:

1. Enter **real card details**:
   ```
   Card: Your real credit/debit card
   Expiry: MM/YY
   CVC: XXX
   ZIP: XXXXX
   ```

2. Click **"Subscribe"**

3. Wait for processing...

4. Should redirect to success page

5. Extension should:
   - Show "PRO" badge
   - Contact limit = "Unlimited"

6. Check Stripe Dashboard:
   - Go to: https://dashboard.stripe.com/payments
   - Should see your payment (live mode)

7. Check Webhook:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click your webhook
   - Check "Events" tab
   - Should see green checkmarks for recent events

**Status:** ✅ / ❌

---

## Test 5: Cancel Subscription (If you tested payment)

To avoid being charged next month:

### Option A: Via Extension
1. Open extension
2. Go to Settings tab
3. Click **"💳 Manage Billing"**
4. Click **"Cancel plan"**

### Option B: Via Stripe Dashboard
1. Go to: https://dashboard.stripe.com/subscriptions
2. Find your subscription
3. Click **"Cancel subscription"**

---

## Common Issues & Solutions

### ❌ Issue: "Price not found"
**Solution:** Your live Price ID is wrong
- Check Stripe Dashboard → Products
- Copy the correct live price ID
- Update Render environment variable
- Redeploy

### ❌ Issue: "Invalid API key"
**Solution:** Wrong Stripe key
- Make sure you're using `sk_live_...` (not `sk_test_...`)
- Check Render environment variables
- Redeploy

### ❌ Issue: Webhook not receiving events
**Solution:** 
- Check webhook URL is correct in Stripe
- Verify `STRIPE_WEBHOOK_SECRET` matches in Render
- Check Render logs for webhook errors

### ❌ Issue: Extension still shows "FREE" after payment
**Solution:**
- Wait 5-10 seconds for webhook to process
- Sign out and sign in again
- Check backend logs for webhook processing

---

## Quick Verification Commands

### Check Backend Logs (Render):
```
Look for:
✅ Webhook received: checkout.session.completed
💰 Checkout completed for user 123, tier: pro
✅ User 123 upgraded to pro
```

### Check Extension Console:
```javascript
// Open extension popup, press F12, run:
chrome.storage.local.get(['user'], (r) => console.log('Tier:', r.user?.tier));

// Should show: Tier: pro
```

---

## 🎉 Success Criteria

Your live Stripe integration is working if:

- [x] Render deployment is live
- [x] Webhook endpoint is accessible
- [x] Extension opens Stripe Checkout
- [x] Stripe shows **live mode** (not test mode)
- [x] Payment processes successfully (if tested)
- [x] Webhook receives events (check Stripe Dashboard)
- [x] User tier updates to "pro" (check extension)

---

## What's Next?

After testing is successful, you want to create:

**📱 Website Upgrade Page**
- A simple page on www.crm-sync.net
- With a "Upgrade to Pro" button
- That creates Stripe Checkout
- So customers can upgrade without using the extension

Let me know when testing is complete and I'll create the website page! 🚀
