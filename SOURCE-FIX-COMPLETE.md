# Source Badge Fix - Complete Solution ✅

## Problem Identified ✅
The extension's `sync.js` was **stripping out the `source` field** during contact normalization.

## Fixes Applied

### **1. Extension Fix (sync.js)** ✅
Added `source` and `crmMappings` fields to the `normalizeContact()` function:
```javascript
source: serverContact.source,
crmMappings: serverContact.crmMappings || serverContact.crm_status,
```

### **2. Database Status** ✅
- 2,201 contacts have `source = 'hubspot'` ✅
- 7 contacts have NULL source (need quick fix)

---

## Final Steps

### **Step 1: Fix NULL Contacts in Database**

Run this in your PostgreSQL shell:

```sql
-- Fix NULL contacts based on their CRM mappings
UPDATE contacts 
SET source = 'hubspot' 
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
)
AND source IS NULL;

-- Fix any remaining NULL contacts (probably Gmail)
UPDATE contacts 
SET source = 'gmail'
WHERE source IS NULL;

-- Verify fix
SELECT source, COUNT(*) FROM contacts GROUP BY source;
```

### **Step 2: Reload Extension**

1. Go to `chrome://extensions`
2. Click the **Reload** button (🔄) on CRM-Sync extension
3. This loads the fixed `sync.js`

### **Step 3: Clear Cache & Re-Sync**

1. Open extension popup
2. Right-click → Inspect → Console
3. Run:
   ```javascript
   chrome.storage.local.clear().then(() => {
     console.log('✅ Cache cleared!');
     window.close();
   });
   ```
4. **Close and reopen** popup
5. **Sign in** again
6. Go to **CRM tab** → Click **"Sync from HubSpot"**

---

## Expected Result

After these steps, contacts should show:
- **Source Badge:** 🔵 H (HubSpot) ✅
- **Sync Indicator:** ✓H (if synced to HubSpot) ✅
- **Gmail contacts:** 📧 G badge
- **No more "C" badges!** ✅

---

## Why It Was Broken

**Before:**
```javascript
// sync.js normalizeContact() - MISSING source field!
return {
  email: serverContact.email,
  firstName: serverContact.firstName,
  // ... other fields ...
  createdAt: serverContact.createdAt,
  // ❌ source field was NOT included!
};
```

**After (Fixed):**
```javascript
return {
  email: serverContact.email,
  firstName: serverContact.firstName,
  source: serverContact.source, // ✅ NOW INCLUDED!
  crmMappings: serverContact.crmMappings, // ✅ FOR SYNC STATUS
  // ... other fields ...
};
```

---

**Ready to test!** Run Step 1 (fix database), then Steps 2-3 (reload & re-sync). 🚀
