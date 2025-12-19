# 🚀 Render Deployment Setup

## ✅ Quick Setup for Your CRMSYNC Backend

Your backend is now configured with CORS for **www.crm-sync.net**!

---

## 📋 Render Environment Variables (REQUIRED)

After pushing to GitHub, set these environment variables on Render:

### **Go to:** Render Dashboard → crmsync-api → Environment

Add these environment variables:

```env
# 1. PRODUCTION MODE
NODE_ENV=production

# 2. CORS - IMPORTANT!
ALLOWED_ORIGINS=https://www.crm-sync.net,https://crm-sync.net

# 3. DATABASE (already set by Render when you connected PostgreSQL)
DATABASE_URL=<auto-filled by Render>

# 4. JWT SECRETS (Generate new ones!)
JWT_SECRET=<generate-with-command-below>
REFRESH_TOKEN_SECRET=<generate-with-command-below>

# 5. STRIPE (Get from: https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_xxxxx  # Use live keys for production
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 6. STRIPE PRICE IDs (from: https://dashboard.stripe.com/products)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxx

# 7. FRONTEND URL
FRONTEND_URL=https://www.crm-sync.net

# 8. ERROR TRACKING (optional)
# SENTRY_DSN=https://xxxxx@xxx.ingest.sentry.io/xxxxx
```

---

## 🔑 Generate Secure JWT Secrets

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it **twice** to get two different secrets:
- First one → `JWT_SECRET`
- Second one → `REFRESH_TOKEN_SECRET`

---

## 🎯 After Setting Environment Variables:

1. Click **"Save Changes"** in Render
2. Render will **automatically redeploy** (takes ~2 minutes)
3. Check the **Logs** tab to ensure no errors
4. Look for: `✅ CRMSYNC API SERVER RUNNING`

---

## 🧪 Test Your Deployment:

### Test 1: Health Check
```bash
curl https://crmsync-api.onrender.com/health
```

**Expected:** `{"status":"healthy",...}`

### Test 2: CORS Check
```bash
curl -I -X OPTIONS https://crmsync-api.onrender.com/api/auth/login \
  -H "Origin: https://www.crm-sync.net"
```

**Expected:** `Access-Control-Allow-Origin: https://www.crm-sync.net`

### Test 3: From Browser
1. Go to: **www.crm-sync.net/#/login**
2. Open console (F12)
3. Try logging in
4. Should **NOT** see CORS errors!

---

## ✅ Quick Checklist:

- [ ] Push code to GitHub (this repo)
- [ ] Render auto-deploys
- [ ] Set `ALLOWED_ORIGINS` on Render
- [ ] Set `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Set Stripe keys (if using subscriptions)
- [ ] Click "Save Changes"
- [ ] Wait for deployment (~2 min)
- [ ] Test health endpoint
- [ ] Test CORS
- [ ] Test login from website

---

## 🔧 Troubleshooting:

### Still getting CORS errors?

**Check Render logs:**
1. Go to Render Dashboard
2. Click "crmsync-api"
3. Click "Logs" tab
4. Look for CORS-related errors

**Verify environment variable:**
```bash
# In Render logs, you should see:
ALLOWED_ORIGINS=https://www.crm-sync.net,https://crm-sync.net
```

### Backend not starting?

**Common issues:**
1. Missing `DATABASE_URL` - Render should set this automatically
2. Missing JWT secrets - Generate and add them
3. Port already in use - Render handles this automatically

**Check logs for error messages:**
- Look for: `❌` or `Error:` in logs

---

## 📚 Need More Help?

**Check these files:**
- `ENV_TEMPLATE.txt` - Full list of environment variables
- `PRODUCTION_DEPLOYMENT.md` - Detailed production setup
- `QUICK_START.md` - Development setup

**Or share:**
- Screenshot of Render logs
- Screenshot of environment variables
- Error message from console

---

## 🎉 Success!

When working, you'll see:
- ✅ No CORS errors
- ✅ Login works on website
- ✅ Extension receives auth data
- ✅ Contact syncing works

**Your backend is now production-ready!** 🚀
