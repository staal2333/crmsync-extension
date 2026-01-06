# Fix Contact Source & Sync Status ✅

## Problem
Contacts imported from HubSpot are showing:
- ❌ **Source:** "CRM Sync" (should be "HubSpot")
- ❌ **Synced badge:** Missing (should show `✓H`)

## Root Cause
The backend import code wasn't setting the `source` field when importing from HubSpot/Salesforce.

---

## Fixes Applied

### **1. ✅ Backend Code Fixed (Future Imports)**

**Files Modified:**
- `hubspotController.js` - Now sets `source = 'hubspot'` when importing
- `salesforceController.js` - Now sets `source = 'salesforce'` when importing

**What Changed:**
```javascript
// Before:
INSERT INTO contacts (user_id, email, first_name, last_name, created_at, updated_at)

// After:
INSERT INTO contacts (user_id, email, first_name, last_name, source, created_at, updated_at)
VALUES ($1, $2, $3, $4, 'hubspot', NOW(), NOW())
```

**Impact:** All **new** imports will have correct source ✅

---

### **2. 🔧 Database Migration (Fix Existing Contacts)**

**File Created:** `crmsync-backend/migrations/fix_contact_sources.sql`

This migration will:
1. Find contacts with HubSpot mappings → Set `source = 'hubspot'`
2. Find contacts with Salesforce mappings → Set `source = 'salesforce'`
3. Show verification counts

---

## How to Deploy

### **Step 1: Deploy Backend Changes**

```bash
cd crmsync-backend/crmsync-backend

git add src/controllers/hubspotController.js
git add src/controllers/salesforceController.js

git commit -m "Fix: Set correct source when importing from HubSpot/Salesforce"

git push origin main
```

Wait for Render deployment (~2-3 min)

---

### **Step 2: Run Database Migration**

**Option A: Using Render Shell (Backend Service)**

1. Go to: https://dashboard.render.com
2. Click your **backend service** (crmsync-api)
3. Click **"Shell"** tab
4. Run:

```bash
psql $DATABASE_URL << 'EOF'
-- Update HubSpot contacts
UPDATE contacts
SET source = 'hubspot'
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
)
AND (source IS NULL OR source = 'crm-sync' OR source = 'gmail');

-- Update Salesforce contacts
UPDATE contacts
SET source = 'salesforce'
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'salesforce'
)
AND (source IS NULL OR source = 'crm-sync' OR source = 'gmail');

-- Verify
SELECT source, COUNT(*) as count FROM contacts GROUP BY source;
EOF
```

**Expected Output:**
```
UPDATE 450  (or however many you have)
UPDATE 0    (if no Salesforce contacts)
  source   | count
-----------+-------
 hubspot   |   450
 gmail     |    50
(2 rows)
```

---

**Option B: Using Local psql**

```bash
psql $DATABASE_URL -f crmsync-backend/migrations/fix_contact_sources.sql
```

---

### **Step 3: Reload Extension**

```
1. Chrome → chrome://extensions
2. Find "CRM Sync"
3. Click "Reload"
```

---

### **Step 4: Verify in Extension**

1. Open popup
2. Go to "Contacts" tab
3. Check your contacts:

**Before:**
```
Contact Name | Email | ● | 🔄
Source: CRM Sync
Synced: —
```

**After:**
```
Contact Name | Email | ● | 🔵
Source: HubSpot
Synced: ✓H
```

✅ Perfect!

---

## What Each Part Does

### **Source Badge (HubSpot/Salesforce/Gmail):**
- Shows where the contact originated from
- Controlled by `contacts.source` field in database
- Display logic: `popup.js` line ~2300

### **Synced Badge (✓H / ✓S):**
- Shows if contact exists in CRM platform
- Controlled by `crm_contact_mappings` table
- Display logic: `popup.js` line ~2350

---

## Technical Details

### **Database Tables:**

**1. `contacts` table:**
```sql
- id (UUID)
- user_id (UUID)
- email (VARCHAR)
- source (VARCHAR) ← This is what we're fixing!
  - 'gmail'      → Show 📧 Gmail badge
  - 'hubspot'    → Show 🔵 HubSpot badge
  - 'salesforce' → Show 🔴 Salesforce badge
  - 'crm-sync'   → Show 🔄 (old/incorrect)
```

**2. `crm_contact_mappings` table:**
```sql
- contact_id (UUID) → Links to contacts.id
- platform (VARCHAR) → 'hubspot' or 'salesforce'
- crm_contact_id (VARCHAR) → ID in HubSpot/Salesforce
- last_synced (TIMESTAMP)
```

**Logic:**
- If `contact.source = 'hubspot'` → Show HubSpot badge
- If `crm_contact_mappings` exists for contact + platform → Show `✓H` or `✓S`

---

## Testing Scenarios

### **Test 1: Existing HubSpot Contacts**
```
1. Go to Contacts tab
2. Find a contact you imported from HubSpot
3. Should show:
   - Source badge: 🔵 (HubSpot)
   - Synced: ✓H
```

### **Test 2: New Gmail Contact**
```
1. Open a new email in Gmail
2. Contact auto-detected
3. Should show:
   - Source badge: 📧 (Gmail)
   - Synced: — (not pushed yet)
4. Push to HubSpot
5. Should show:
   - Source badge: 📧 (Gmail - original source)
   - Synced: ✓H (now in HubSpot too)
```

### **Test 3: New Import from HubSpot**
```
1. Go to CRM tab
2. Click "Sync from HubSpot"
3. New contacts imported
4. Should show:
   - Source badge: 🔵 (HubSpot)
   - Synced: ✓H
```

---

## SQL Queries for Debugging

**Check contact sources:**
```sql
SELECT source, COUNT(*) as count 
FROM contacts 
GROUP BY source 
ORDER BY count DESC;
```

**Check which contacts have HubSpot mappings:**
```sql
SELECT c.email, c.source, ccm.platform, ccm.crm_contact_id
FROM contacts c
LEFT JOIN crm_contact_mappings ccm ON c.id = ccm.contact_id
WHERE ccm.platform = 'hubspot'
LIMIT 10;
```

**Find contacts with wrong source:**
```sql
SELECT c.email, c.source, ccm.platform
FROM contacts c
INNER JOIN crm_contact_mappings ccm ON c.id = ccm.contact_id
WHERE ccm.platform = 'hubspot' 
AND c.source != 'hubspot';
```

---

## Summary

### **Changes Made:**

1. ✅ **Backend:** Set `source = 'hubspot'/'salesforce'` when importing
2. ✅ **Migration:** Update existing contacts with correct source
3. ✅ **Future-proof:** All new imports will have correct source

### **Expected Result:**

- ✅ HubSpot contacts show: 🔵 HubSpot badge + ✓H
- ✅ Salesforce contacts show: 🔴 Salesforce badge + ✓S  
- ✅ Gmail contacts show: 📧 Gmail badge + (✓H if pushed)

### **Deploy Steps:**

1. ✅ Push backend code to GitHub
2. ✅ Wait for Render deployment
3. ✅ Run SQL migration
4. ✅ Reload extension
5. ✅ Test & verify!

---

**Time to deploy:** ~5 minutes  
**Risk:** None (migration is safe, uses UPDATE with WHERE clause)  
**Impact:** All imported contacts now correctly labeled ✅
