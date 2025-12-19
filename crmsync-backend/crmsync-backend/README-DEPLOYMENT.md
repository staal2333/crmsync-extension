# 🚀 CRMSYNC Backend Deployment Guide

## Prerequisites

- GitHub account
- Render account (or Railway)
- Domain name (optional but recommended)

## Quick Deploy to Render

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for production deployment"

# Create repo on GitHub: crmsync-backend
git remote add origin https://github.com/YOUR_USERNAME/crmsync-backend.git
git branch -M main
git push -u origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Settings:
   - **Name:** `crmsync-db`
   - **Database:** `crmsync`
   - **User:** `crmsync_user`
   - **Region:** Choose closest to you
   - **Plan:** Free or Starter ($7/mo)
4. Click "Create Database"
5. **SAVE the Internal Database URL** (you'll need it next)

### 3. Create Web Service on Render

1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - **Name:** `crmsync-api`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter ($7/mo)

### 4. Add Environment Variables

Click "Environment" and add these variables:

```env
NODE_ENV=production
PORT=3000

# Database - Use Internal Database URL from step 2
DATABASE_URL=postgresql://crmsync_user:PASSWORD@hostname/crmsync

# JWT Secrets - Generate new ones or use existing
JWT_SECRET=YOUR_LONG_RANDOM_STRING_HERE
REFRESH_TOKEN_SECRET=YOUR_OTHER_LONG_RANDOM_STRING_HERE

# Stripe Keys - Start with TEST, switch to LIVE when ready
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_1SewtEFyB6BgsXQ0urEgr6hN
STRIPE_PRICE_PRO_YEARLY=price_1SewtzFyB6BgsXQ028jd0Xmo
STRIPE_PRICE_BUSINESS_MONTHLY=price_1SewvGFyB6BgsXQ079zbn4cm
STRIPE_PRICE_BUSINESS_YEARLY=price_1SewvqFyB6BgsXQ0ctLLwzd9

# Frontend URL - Update after website is deployed
FRONTEND_URL=https://crmsync.com

# CORS - Update with your domains
ALLOWED_ORIGINS=https://mail.google.com,https://outlook.office.com,https://crmsync.com

LOG_LEVEL=info
```

### 5. Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Your API will be at: `https://crmsync-api.onrender.com`

### 6. Run Migration

In Render Dashboard → Your Service → Shell tab:

```bash
npm run migrate
```

Or run locally against production database:

```bash
DATABASE_URL="YOUR_EXTERNAL_DATABASE_URL" npm run migrate
```

### 7. Test

```bash
curl https://crmsync-api.onrender.com/health
```

Should return: `{"status":"healthy"...}`

## Stripe Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://crmsync-api.onrender.com/api/subscription/webhook`
4. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Copy webhook signing secret
6. Add to Render environment variables: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

## Switching to Stripe LIVE Mode

**Only do this when ready for real payments!**

1. Toggle Stripe dashboard to "Live mode"
2. Get live API keys
3. Update Render environment variables:
   - `STRIPE_SECRET_KEY=sk_live_xxxxx`
   - `STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx`
4. Create new webhook for live mode
5. Update `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

**Deployment fails:**
- Check build logs in Render
- Ensure all dependencies in package.json
- Check Node version compatibility

**Database connection errors:**
- Use Internal Database URL (not External)
- Check database is in same region
- Verify credentials

**Webhook not working:**
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Stripe webhook logs
- Check Render service logs

## Monitoring

- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Render Dashboard → Your Service → Metrics
- **Alerts:** Set up in Render settings

## Costs

**Free Tier:**
- Web Service: Free (sleeps after inactivity)
- PostgreSQL: Free (limited storage)

**Starter Tier ($14/month):**
- Web Service: $7/month (always on)
- PostgreSQL: $7/month (25GB storage)

**Upgrade when:**
- You have paying customers
- Need 99.9% uptime
- Free tier performance isn't enough

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- CRMSYNC Issues: GitHub Issues

---

**Deployment Date:** _____________________
**Deployed URL:** _____________________
**Database URL:** _____________________ (keep secret!)

