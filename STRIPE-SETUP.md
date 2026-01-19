# 💳 Stripe Payment Integration - Setup Guide

## ✅ What's Been Implemented

### Frontend (Chrome Extension):
- ✅ `payment.js` - Stripe checkout session creation
- ✅ `payment-success.html` - Post-payment success page
- ✅ `payment-cancel.html` - Payment cancellation page
- ✅ Updated `popup.js` to initialize payment buttons
- ✅ Updated `manifest.json` to include payment pages

### Backend (Already Existed):
- ✅ `/api/subscription/create-checkout` - Creates Stripe checkout session
- ✅ `/api/subscription/webhook` - Handles Stripe webhooks
- ✅ `/api/subscription/status` - Gets subscription status
- ✅ `/api/subscription/create-portal` - Opens customer portal

---

## 🔧 Required Setup Steps

### 1. Get Stripe API Keys

1. Go to: https://dashboard.stripe.com/
2. Sign in or create account
3. Get your keys from: https://dashboard.stripe.com/test/apikeys

**For Testing (Test Mode):**
- Test Secret Key: `sk_test_...`
- Test Publishable Key: `pk_test_...`

**For Production (Live Mode):**
- Live Secret Key: `sk_live_...`
- Live Publishable Key: `pk_live_...`

---

### 2. Create Stripe Products & Prices

#### Option A: Using Stripe Dashboard (Recommended)

1. Go to: https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Create **Pro Plan**:
   - Name: `CRMSYNC Pro`
   - Description: `Unlimited contacts, cloud sync, and premium features`
   - **Pricing:**
     - Monthly: `$9.99/month` (or your price)
     - Yearly: `$99/year` (or your price)
   - Recurring: Yes
4. After creating, copy the **Price IDs**:
   - Example: `price_1ABC123xyz` (monthly)
   - Example: `price_1DEF456xyz` (yearly)

#### Option B: Using Stripe CLI

```bash
stripe products create --name="CRMSYNC Pro" --description="Unlimited contacts & premium features"

stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=year
```

---

### 3. Set Backend Environment Variables

Add to your `.env` file (or Render dashboard):

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_51ABC...XYZ
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_1ABC123xyz
STRIPE_PRICE_PRO_YEARLY=price_1DEF456xyz

# Frontend URL (for Stripe redirects)
FRONTEND_URL=https://www.crm-sync.net
```

**On Render.com:**
1. Go to: https://dashboard.render.com/
2. Select your backend service
3. Go to: **Environment** tab
4. Add each variable above
5. Click **Save Changes**

---

### 4. Update Extension Price IDs

Edit: `Saas Tool/payment.js`

```javascript
const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1ABC123xyz', // 👈 Replace with your actual Price ID
  PRO_YEARLY: 'price_1DEF456xyz',  // 👈 Replace with your actual Price ID
};
```

---

### 5. Set Up Stripe Webhook

#### For Testing (Local Development):

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

Copy the webhook secret (`whsec_...`) to your `.env` file.

#### For Production (Render):

1. Go to: https://dashboard.stripe.com/webhooks
2. Click: **Add endpoint**
3. Set endpoint URL:
   ```
   https://crmsync-api.onrender.com/api/subscription/webhook
   ```
4. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`)
7. Add to Render environment variables as `STRIPE_WEBHOOK_SECRET`

---

### 6. Test the Integration

#### Test Payment Flow:

1. Reload your extension in Chrome:
   - Go to: `chrome://extensions`
   - Find: **CRMSYNC**
   - Click: **Reload** 🔄

2. Open the extension popup

3. Click: **"✨ Upgrade to Pro"** button

4. You should see:
   - New tab opens with Stripe Checkout
   - Shows "CRMSYNC Pro" product
   - Price: $9.99/month (or your price)

5. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

6. Complete payment

7. You should:
   - See success page for 5 seconds
   - Extension popup reloads
   - Tier badge changes from "FREE" to "PRO"
   - Contact limit shows "Unlimited"

#### Test Webhook:

Check your backend logs (Render dashboard → Logs):
```
✅ Webhook received: checkout.session.completed
💰 Checkout completed for user 123, tier: pro
✅ User 123 upgraded to pro
```

---

## 🎯 User Flow

### For Free Users:

1. User sees warning: "Almost at your limit! (45/50)"
2. Clicks: "✨ Upgrade to Pro"
3. Redirected to Stripe Checkout
4. Enters payment details
5. Completes payment
6. Sees success page
7. Returns to extension
8. Tier automatically upgraded to "PRO"
9. Unlimited contacts unlocked

### For Pro Users:

1. No upgrade buttons shown
2. Can click "Manage Subscription" (if you add the button)
3. Opens Stripe Customer Portal
4. Can:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Switch to yearly plan

---

## 🔐 Security Notes

### ✅ Already Implemented:

1. **Backend validates user** - Uses JWT authentication
2. **Stripe validates payment** - Webhook signature verification
3. **No sensitive data in extension** - Price IDs are public
4. **HTTPS only** - All API calls use HTTPS

### ⚠️ Important:

- **NEVER** put `STRIPE_SECRET_KEY` in extension code
- **ALWAYS** verify webhook signatures
- **ALWAYS** update user tier in webhook, not frontend

---

## 💰 Pricing Recommendations

### Suggested Pricing:

**Pro Plan:**
- Monthly: $9.99/month
- Yearly: $99/year (2 months free)

**Business Plan (Future):**
- Monthly: $29.99/month
- Yearly: $299/year (2 months free)

### Free Trial:

Currently set to **14 days** in `subscription.js`:
```javascript
trial_period_days: 14
```

You can change this or remove it.

---

## 📊 Testing Checklist

- [ ] Stripe account created
- [ ] Test mode enabled
- [ ] Products created in Stripe Dashboard
- [ ] Price IDs copied
- [ ] Backend env vars set on Render
- [ ] Extension `payment.js` updated with Price IDs
- [ ] Extension reloaded in Chrome
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] Webhook secret added to Render env vars
- [ ] Test payment completed successfully
- [ ] Tier upgraded automatically
- [ ] Webhook received in backend logs
- [ ] Database updated (user tier = 'pro')
- [ ] Extension shows "PRO" badge

---

## 🚀 Go Live Checklist

When ready for production:

- [ ] Switch Stripe to **Live Mode**
- [ ] Update `STRIPE_SECRET_KEY` with live key (`sk_live_...`)
- [ ] Update Price IDs in extension with live prices
- [ ] Create **live** webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test with real card
- [ ] Update pricing on website
- [ ] Add "Manage Subscription" button in extension settings

---

## 📞 Need Help?

- **Stripe Docs:** https://stripe.com/docs/payments/checkout
- **Stripe Support:** https://support.stripe.com/
- **Test Cards:** https://stripe.com/docs/testing#cards

---

## 🎉 Next Steps

After Stripe is working:

1. **Add "Manage Subscription" button** in Settings tab
2. **Add yearly plan option** (save 17%!)
3. **Create Business tier** ($29.99/month)
4. **Add discount codes** for early adopters
5. **Set up invoice emails** (automatic via Stripe)
6. **Add analytics** to track conversions
