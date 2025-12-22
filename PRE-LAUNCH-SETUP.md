# ✅ Pre-Launch Setup Checklist

**Run through this checklist before launching CRMSYNC!**

---

## 🔴 **CRITICAL - Must Complete** (30 minutes)

### **1. Google OAuth Setup** ⏱️ 15 min

**Status:** ⚠️ **REQUIRED**

**Current:** `manifest.json` has placeholder client ID

**Action Required:**
```bash
# 1. Go to Google Cloud Console
open https://console.cloud.google.com

# 2. Create project "CRMSYNC"
# 3. Enable "Google Identity Services API"
# 4. Create OAuth 2.0 Client ID:
#    - Type: Chrome Extension
#    - Add your extension ID to authorized origins
# 5. Copy the Client ID

# 6. Update manifest.json:
# Replace: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
# With: Your actual client ID from step 5
```

**Test:**
```bash
# 1. Reload extension in chrome://extensions
# 2. Click extension icon
# 3. Click "Sign in with Google"
# 4. Should open Google login popup
# 5. After login, should see your email
```

---

### **2. JWT Secrets Rotation** ⏱️ 5 min

**Status:** 🔴 **CRITICAL SECURITY ISSUE**

**Risk:** Default secrets allow token forgery!

**Action Required:**
```bash
# Generate two strong secrets:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Copy both outputs

# Update on Render:
# 1. Go to: https://dashboard.render.com
# 2. Select your "crmsync-backend" service  
# 3. Click "Environment" tab
# 4. Update JWT_SECRET (paste first output)
# 5. Update REFRESH_TOKEN_SECRET (paste second output)
# 6. Click "Save Changes"
# 7. Wait for service to restart (2-3 min)
```

**Test:**
```bash
# 1. Go to: https://www.crm-sync.net
# 2. Try to log in
# 3. Should work normally
# 4. Check extension - should show account info
```

---

### **3. Environment Variables Check** ⏱️ 10 min

**Status:** ⚠️ **VERIFY ALL SET**

**Render Backend Variables:**

Go to: https://dashboard.render.com → Your Service → Environment

```bash
# Core
✅ NODE_ENV=production
✅ PORT=10000
✅ DATABASE_URL=[auto-filled by Render]

# Auth (UPDATED IN STEP 2)
✅ JWT_SECRET=[from step 2]
✅ REFRESH_TOKEN_SECRET=[from step 2]

# Stripe
✅ STRIPE_SECRET_KEY=[from Stripe dashboard]
✅ STRIPE_WEBHOOK_SECRET=[from Stripe webhooks]
✅ STRIPE_PRICE_ID_PRO=[from Stripe products]
✅ STRIPE_PRICE_ID_BUSINESS=[from Stripe products]
✅ STRIPE_PRICE_ID_ENTERPRISE=[from Stripe products]

# Email (Postmark)
✅ EMAIL_HOST=smtp.postmarkapp.com
✅ EMAIL_PORT=587
✅ EMAIL_USER=[Postmark SMTP token]
✅ EMAIL_PASS=[Postmark SMTP token]
✅ EMAIL_FROM=noreply@crm-sync.net

# Frontend
✅ FRONTEND_URL=https://www.crm-sync.net

# Monitoring (Optional but recommended)
☐ SENTRY_DSN=[from sentry.io - see step 5]
```

**Vercel Frontend Variables:**

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

```bash
✅ REACT_APP_API_URL=https://crmsync-api.onrender.com/api
✅ REACT_APP_STRIPE_PUBLIC_KEY=[from Stripe dashboard]
☐ REACT_APP_SENTRY_DSN=[optional - from sentry.io]
```

**Missing Variables?** Add them now!

---

## 🟡 **RECOMMENDED - Should Complete** (1 hour)

### **4. Health Check Test** ⏱️ 5 min

**Status:** ✅ **ALREADY IMPLEMENTED**

**Test:**
```bash
# Basic health check
curl https://crmsync-api.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 12345,
  "memory": { "used": "45MB", "total": "120MB" }
}

# Database health check
curl https://crmsync-api.onrender.com/health/db

# Expected response:
{
  "status": "healthy",
  "database": "postgres",
  "timestamp": "2025-12-17T..."
}
```

**If either fails:** Check Render logs for errors

---

### **5. Error Monitoring Setup** ⏱️ 20 min

**Status:** ✅ **CODE READY** - Just need to configure

**Action Required:**

```bash
# 1. Sign up for Sentry (free tier)
open https://sentry.io/signup

# 2. Create two projects:
#    - "CRMSYNC Backend" 
#    - "CRMSYNC Frontend"

# 3. Copy DSNs for each

# 4. Add to Render (Backend):
#    Environment → SENTRY_DSN → [backend DSN]

# 5. Add to Vercel (Frontend):
#    Settings → Environment Variables → REACT_APP_SENTRY_DSN → [frontend DSN]

# 6. Restart both services

# 7. Test error reporting:
#    - Make an API call that fails
#    - Check Sentry dashboard
#    - Should see the error appear
```

**Benefits:**
- 📧 Email alerts for errors
- 📊 Error tracking dashboard
- 🔍 Full stack traces
- 📈 Performance monitoring

---

### **6. Full End-to-End Test** ⏱️ 30 min

**Status:** ⚠️ **MUST RUN BEFORE LAUNCH**

**Test Checklist:**

```bash
✅ INSTALLATION
☐ Install extension from local files
☐ Extension icon appears in toolbar
☐ Click icon → popup opens
☐ No console errors

✅ REGISTRATION  
☐ Click "Sign Up"
☐ Opens: https://www.crm-sync.net/#/register
☐ Fill form with test email
☐ Submit → receives confirmation email
☐ Redirects back to extension
☐ Shows welcome message

✅ GOOGLE LOGIN (IF OAUTH CONFIGURED)
☐ Click "Sign in with Google"
☐ Google popup appears
☐ Can select account
☐ Returns to extension
☐ Shows account info

✅ CONTACT EXTRACTION
☐ Open Gmail: https://mail.google.com
☐ Open an email with signature
☐ Click extension icon
☐ Contact appears in list
☐ Has: name, email, company (if found)
☐ No duplicate contacts

✅ CLOUD SYNC
☐ In popup, click "Sync" button
☐ Shows "Syncing..." message
☐ Shows "Synced with cloud" success
☐ Refresh page → contacts still there
☐ Open in different browser → contacts sync

✅ CSV EXPORT
☐ Click "Export" button
☐ CSV file downloads
☐ Open CSV → data is correct
☐ All fields present

✅ UPGRADE FLOW
☐ Click "Upgrade to Pro"
☐ Opens pricing page
☐ Click "Subscribe to Pro"
☐ Stripe checkout appears
☐ Use test card: 4242 4242 4242 4242
☐ Complete payment
☐ Redirects to success page
☐ Account page shows "PRO" tier
☐ Extension popup shows "PRO" badge
☐ Can export unlimited contacts

✅ SETTINGS & FEATURES
☐ Toggle dark mode → works
☐ Change exclusion settings → saves
☐ Sign out → logs out properly
☐ Sign in again → all data restored

✅ ERROR SCENARIOS
☐ Try invalid login → proper error
☐ Try duplicate registration → proper error
☐ Try sync offline → graceful failure
☐ Try export with 0 contacts → proper message
```

**If ANY test fails:** Fix before launching!

---

## 🟢 **OPTIONAL - Can Do Later**

### **7. Chrome Web Store Prep** ⏱️ 2-3 hours

**Status:** 📝 **READY TO START**

**See:** `LAUNCH-TODAY-PLAN.md` Step 5-8

**Summary:**
1. Create 3-5 screenshots (1280x800px)
2. Create promotional tile (440x280px)
3. Write store listing
4. Prepare demo account
5. Submit for review (takes 2-5 days)

---

### **8. Documentation** ⏱️ 1 hour

**Status:** 📝 **NICE TO HAVE**

**Add to website:**
- Quick Start guide
- FAQ page (5-10 questions)
- Video tutorial (2-3 min)
- Help/Support page

---

## 📊 **COMPLETION STATUS**

```
🔴 Critical Tasks:
[ ] Google OAuth setup
[ ] JWT secrets rotation  
[ ] Environment variables check
[ ] Full end-to-end test

🟡 Recommended Tasks:
[ ] Health check test
[ ] Sentry error monitoring
[ ] Security audit review

🟢 Optional Tasks:
[ ] Chrome Web Store submission
[ ] User documentation
[ ] Analytics setup

Progress: _____ / 8 tasks complete
```

---

## ✅ **WHEN ALL CRITICAL TASKS ARE DONE:**

### **You're Ready to Launch! 🚀**

**Final Steps:**

1. ✅ All critical items checked off above
2. ✅ No console errors in extension
3. ✅ Backend health checks passing
4. ✅ Can complete full user journey
5. ✅ Payments working end-to-end

**Then:**
- Submit to Chrome Web Store
- Soft launch to friends/beta testers
- Monitor Sentry for errors
- Fix critical bugs within 24 hours
- Public launch when Chrome approves

---

## 🚨 **TROUBLESHOOTING**

### **"OAuth not working!"**
```bash
# Check:
1. Client ID correct in manifest.json?
2. OAuth consent screen configured?
3. Extension ID in authorized origins?
4. Extension reloaded after changes?
```

### **"Backend not responding!"**
```bash
# Check:
1. Render service running?
2. Health check passing: https://crmsync-api.onrender.com/health
3. Check Render logs for errors
4. Database connection working?
```

### **"Stripe payments failing!"**
```bash
# Check:
1. STRIPE_SECRET_KEY set on Render?
2. STRIPE_WEBHOOK_SECRET set?
3. Webhook endpoint registered in Stripe?
4. Using test mode cards for testing?
```

### **"Extension not syncing!"**
```bash
# Check browser console for:
1. Auth token present?
2. API calls succeeding?
3. CORS errors?
4. Network connectivity?
```

---

## 📞 **GET HELP**

**Documentation:**
- `PRODUCTION-READINESS-FINAL.md` - Comprehensive guide
- `LAUNCH-TODAY-PLAN.md` - Detailed launch steps
- `SECURITY-QUICK-FIX.md` - JWT rotation guide

**External Resources:**
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- Render Docs: https://render.com/docs
- Stripe Docs: https://stripe.com/docs

---

## 🎯 **YOUR NEXT STEP:**

**Right now:**

1. ✅ Check off Step 1 (Google OAuth) OR
2. ✅ Check off Step 2 (JWT Secrets) ← **Start here!**

**Both are critical** - do them both today!

---

**Good luck! You're almost there! 🚀**
