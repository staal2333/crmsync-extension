# Backend Deployment - Step by Step

## 🚀 Deploy to Render.com

### Step 1: Push Code to GitHub
```bash
cd "c:\Users\sebas\Downloads\Saas Tool-20251202T124049Z-3-001"
git push origin main
```

**If git push fails (network issue)**: Try again in a few minutes. The code is committed locally (commit: 36e51d6).

---

### Step 2: Render Auto-Deploy (or Manual Trigger)

Render should automatically deploy when you push to main. If not:

1. Go to: https://dashboard.render.com
2. Find your service: **crmsync-api**
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build (usually 2-3 minutes)

---

### Step 3: Run Database Migration

Once deployed, you need to run the new migration:

#### Option A: Via Render Shell (Recommended)
1. Go to Render dashboard → crmsync-api
2. Click "Shell" button (top right)
3. Run these commands:

```bash
cd ~/project/src/crmsync-backend/crmsync-backend

# Run the migration
psql $DATABASE_URL < migrations/008_add_subscription_columns.sql

# Verify it worked
psql $DATABASE_URL -c "\d users" | grep subscription
```

**Expected output**:
```
subscription_tier        | character varying(50)  | | | 'free'::character varying
subscription_status      | character varying(50)  | | | 'inactive'::character varying
subscription_started_at  | timestamp without time zone
subscription_ends_at     | timestamp without time zone
stripe_customer_id       | character varying(255)
trial_ends_at           | timestamp without time zone
```

#### Option B: Manual SQL (if Shell doesn't work)

Copy this SQL and run it directly in your database client (TablePlus, pgAdmin, etc.):

```sql
-- Add Stripe integration columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
ON users(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_users_subscription_status 
ON users(subscription_status);

-- Comments
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for webhook identification';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, canceled, past_due, trialing, inactive';
COMMENT ON COLUMN users.subscription_started_at IS 'When current subscription period started';
COMMENT ON COLUMN users.subscription_ends_at IS 'When current subscription period ends';
COMMENT ON COLUMN users.trial_ends_at IS 'When free trial ends';
```

---

### Step 4: Verify Deployment

Test the new endpoints:

#### Test 1: Health Check
```bash
curl https://crmsync-api.onrender.com/health
```

**Expected**: `{"status":"healthy","timestamp":"..."}`

#### Test 2: User Me Endpoint (with your JWT token)
```bash
curl https://crmsync-api.onrender.com/api/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: User object with `tier` and `subscriptionTier` fields

#### Test 3: HubSpot Fetch Endpoint (after connecting HubSpot)
```bash
curl "https://crmsync-api.onrender.com/api/integrations/hubspot/fetch-contacts?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Array of contacts with `crmId`, `email`, `firstName`, etc.

#### Test 4: Webhook Endpoint
```bash
curl -X POST https://crmsync-api.onrender.com/api/webhooks/subscription-update \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-uuid","tier":"pro","event":"test"}'
```

**Expected**: `{"success":true,"message":"Subscription updated successfully"}`

---

### Step 5: Check Logs

Monitor for errors:

1. Go to Render dashboard → crmsync-api → Logs
2. Look for these success messages:
   - `✅ Database connected successfully`
   - `🚀 Server running on port ...`
   - `✅ Sentry error tracking initialized` (if production)
3. Check for error messages (lines starting with `❌`)

---

## 🔧 Troubleshooting

### Migration Fails with "column already exists"

This is OK! It means the column was added before. Skip to verification step.

### "Module not found: webhooks"

**Fix**: Make sure all files were pushed to GitHub:
```bash
git status
git add -A
git commit -m "Add webhooks routes"
git push origin main
```

Then trigger a new deploy on Render.

### "Cannot connect to database"

**Check**:
1. Render dashboard → crmsync-api → Environment
2. Verify `DATABASE_URL` is set
3. Test database health: `curl https://crmsync-api.onrender.com/health/db`

### 404 on /api/webhooks/...

**Cause**: Server.js didn't mount the routes correctly.

**Fix**: Check that `server.js` has this line:
```javascript
app.use('/api/webhooks', webhooksRoutes);
```

---

## ✅ Deployment Complete Checklist

- [ ] Code pushed to GitHub (commit: 36e51d6 or later)
- [ ] Render deployed successfully (green checkmark)
- [ ] Migration `008_add_subscription_columns.sql` executed
- [ ] Health check returns `{"status":"healthy"}`
- [ ] `/api/user/me` endpoint works with JWT token
- [ ] `/api/integrations/hubspot/fetch-contacts` endpoint exists (test after connecting HubSpot)
- [ ] `/api/webhooks/subscription-update` endpoint responds
- [ ] No errors in Render logs
- [ ] Database has new subscription columns

---

## 🎯 What Happens After Deployment

### For HubSpot Auto-Sync
1. Users connect HubSpot in extension settings
2. Extension calls `GET /api/integrations/hubspot/status` to verify connection
3. Background script starts calling `GET /api/integrations/hubspot/fetch-contacts` every 30 minutes
4. Contacts merge into local storage automatically

### For Subscription Auto-Update
1. User upgrades on website → Database updates `subscription_tier = 'pro'`
2. Extension polls `GET /api/user/me` every 5 minutes
3. When tier changes, extension shows notification and reloads
4. Pro features (CRM integrations) unlock immediately

---

## 📊 Monitoring After Launch

### Key Metrics to Watch
1. **API Response Times**
   - `/api/user/me`: Should be < 200ms
   - `/api/integrations/hubspot/fetch-contacts`: Should be < 3s for 100 contacts

2. **Error Rates**
   - Watch Render logs for `❌` error messages
   - Set up Sentry alerts if configured

3. **Database Performance**
   - Monitor connection pool usage
   - Check for slow queries (> 1s)

4. **Webhook Success Rate**
   - When Stripe integration goes live, monitor webhook failures
   - Check `/api/webhooks/stripe` logs

---

## 🚨 Rollback Plan (If Needed)

If something breaks:

### Quick Rollback
```bash
# In Render dashboard
1. Go to crmsync-api → Deploys
2. Find previous successful deploy
3. Click "Rollback to this version"
```

### Revert Database Migration
```sql
-- Only if migration causes issues
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_started_at;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_ends_at;
ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;

DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_subscription_status;
```

---

**Status**: Ready to deploy ✅  
**Time Estimate**: 10-15 minutes  
**Risk Level**: Low (additive changes, no breaking changes)

---

Need help? Check logs first:
- Backend: https://dashboard.render.com → Logs
- Database: `psql $DATABASE_URL` in Render shell
- Extension: Chrome DevTools → Console
