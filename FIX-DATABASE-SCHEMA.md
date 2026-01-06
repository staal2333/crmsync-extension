# Fix Database Schema Error 🔧

## Error
```
❌ Failed to sync to hubspot: Error: column "crm_contact_id" of relation "crm_sync_logs" does not exist
```

## What Happened
- ✅ **Contact WAS pushed to HubSpot** (successful!)
- ❌ **Backend failed to log the sync** (database schema outdated)

The `crm_sync_logs` table in your production database is missing the `crm_contact_id` column that the backend code expects.

---

## Quick Fix (Run SQL Migration)

### **Option A: Using Render Dashboard (Easiest)**

1. **Go to Render Dashboard:**
   ```
   https://dashboard.render.com
   ```

2. **Find your PostgreSQL database:**
   - Click on your database service
   - Go to "Console" tab

3. **Copy and paste this SQL:**
   ```sql
   -- Add missing column
   ALTER TABLE crm_sync_logs ADD COLUMN IF NOT EXISTS crm_contact_id VARCHAR(255);
   
   -- Verify it was added
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'crm_sync_logs' 
   ORDER BY ordinal_position;
   ```

4. **Press Enter**
   - Should see: `ALTER TABLE`
   - Then see list of columns including `crm_contact_id`

5. **Done!** ✅

---

### **Option B: Using psql CLI**

If you have the database URL:

```bash
# Connect to database
psql $DATABASE_URL

# Run migration
ALTER TABLE crm_sync_logs ADD COLUMN IF NOT EXISTS crm_contact_id VARCHAR(255);

# Verify
\d crm_sync_logs

# Exit
\q
```

---

### **Option C: Run Full Migration**

If you want to ensure all CRM tables are up-to-date:

1. **Copy migration file:**
   ```
   crmsync-backend/migrations/add_crm_tables.sql
   ```

2. **Run it in Render Console:**
   - The script has `IF NOT EXISTS` checks, so it's safe to run multiple times
   - It will create missing tables/columns only

---

## Test After Fix

### **Step 1: Reload Extension**
```
1. Chrome → chrome://extensions
2. Find "CRM Sync"
3. Click "Reload" button
```

### **Step 2: Try Push Again**
```
1. Open popup
2. Go to Contacts tab
3. Select 1 contact
4. Click "H" (HubSpot)
5. Watch console:
   - Should see: "🔄 Syncing contact to hubspot..."
   - Should see: "✅ Contact synced to hubspot"
   - Should see: "✓ Contact added to HubSpot"
6. ✅ Success! No error!
```

---

## Verify Contact in HubSpot

1. Go to: https://app.hubspot.com/contacts
2. Search for the contact you just pushed
3. Should be there! ✅

---

## Why This Happened

The `crm_sync_logs` table was created before the `crm_contact_id` column was added to the schema. When you run migrations, you need to run **all** migrations, including updates.

### **Original Schema (Old):**
```sql
CREATE TABLE crm_sync_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  contact_id UUID,
  platform VARCHAR(50),
  action VARCHAR(50),
  status VARCHAR(50),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP
  -- Missing: crm_contact_id ❌
);
```

### **Updated Schema (New):**
```sql
CREATE TABLE crm_sync_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  contact_id UUID,
  platform VARCHAR(50),
  action VARCHAR(50),
  status VARCHAR(50),
  crm_contact_id VARCHAR(255), -- ✅ Added!
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);
```

---

## What the Migration Does

```sql
ALTER TABLE crm_sync_logs 
ADD COLUMN IF NOT EXISTS crm_contact_id VARCHAR(255);
```

- Adds the missing column
- `IF NOT EXISTS` = safe to run multiple times
- `VARCHAR(255)` = stores HubSpot/Salesforce contact IDs

---

## After Migration

### **Extension Will Log:**
- ✅ Contact ID in HubSpot
- ✅ Sync timestamp
- ✅ Action (create/update)
- ✅ Status (success/error)

### **You Can Query:**
```sql
-- See all successful pushes
SELECT * FROM crm_sync_logs 
WHERE status = 'success' 
ORDER BY created_at DESC 
LIMIT 10;

-- See HubSpot contact IDs
SELECT contact_id, crm_contact_id, created_at 
FROM crm_sync_logs 
WHERE platform = 'hubspot' 
AND crm_contact_id IS NOT NULL;
```

---

## Files Reference

**Migration file created:**
- ✅ `crmsync-backend/migrations/fix_crm_sync_logs.sql`

**Full schema:**
- ✅ `crmsync-backend/migrations/add_crm_tables.sql`

**Backend code using this column:**
- ✅ `crmsync-backend/src/controllers/hubspotController.js` (line 378)
- ✅ `crmsync-backend/src/controllers/salesforceController.js` (line 282)

---

## Troubleshooting

### **Issue: Still getting the error**
```bash
# Check if column exists
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'crm_sync_logs';"

# If crm_contact_id is NOT in the list, run:
psql $DATABASE_URL -c "ALTER TABLE crm_sync_logs ADD COLUMN crm_contact_id VARCHAR(255);"
```

### **Issue: Can't access Render Console**
**Solution:** Get database URL and use local psql:
```bash
# Get DATABASE_URL from Render dashboard (Environment tab)
# Then:
psql "your-database-url-here" -c "ALTER TABLE crm_sync_logs ADD COLUMN IF NOT EXISTS crm_contact_id VARCHAR(255);"
```

---

## Summary

### **Current State:**
- ✅ Contact pushed to HubSpot successfully
- ❌ Backend failed to log sync (database schema issue)
- ❌ User sees error message (even though push worked)

### **After Migration:**
- ✅ Contact pushed to HubSpot successfully
- ✅ Backend logs sync successfully
- ✅ User sees success message
- ✅ Sync history available for debugging

---

## Quick One-Liner (Copy & Paste)

**If you have `psql` and `DATABASE_URL`:**
```bash
psql $DATABASE_URL -c "ALTER TABLE crm_sync_logs ADD COLUMN IF NOT EXISTS crm_contact_id VARCHAR(255); SELECT 'Migration complete!' AS status;"
```

**Result:**
```
ALTER TABLE
    status     
---------------
 Migration complete!
```

✅ Done!

---

**Time to fix:** ~2 minutes  
**Risk:** None (safe migration)  
**Impact:** Fixes push logging forever
