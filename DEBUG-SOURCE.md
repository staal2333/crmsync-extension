# Debug Contact Source Issue

## Problem
Contacts showing "C" badge instead of "H" even after cache clear and re-sync.

## Root Cause Analysis

### Frontend Code (popup.js line 2507):
```javascript
const source = contact.source || contact.crmSource || 'crm-sync';
```

This means:
1. Check `contact.source` first
2. If null/undefined, check `contact.crmSource`  
3. If still null, default to `'crm-sync'` → Shows "C" badge

### Backend API (contacts.js line 17):
```javascript
SELECT c.*, ...
FROM contacts c
```

This should return ALL columns including `source`.

---

## Debugging Steps

### **Step 1: Check What Backend Returns**

Open extension popup → Open DevTools Console → Paste:

```javascript
chrome.runtime.sendMessage({ action: 'getContacts' }, (response) => {
  console.log('📦 Raw contacts from backend:', response.contacts.slice(0, 3));
  response.contacts.slice(0, 3).forEach(c => {
    console.log(`Email: ${c.email}`);
    console.log(`Source field: "${c.source}" (type: ${typeof c.source})`);
    console.log(`CrmSource field: "${c.crmSource}" (type: ${typeof c.crmSource})`);
    console.log(`---`);
  });
});
```

**Expected (Good):**
```
Source field: "hubspot" (type: string)
```

**Actual (Bad):**
```
Source field: "null" (type: object)  ← NULL in database!
Source field: "undefined" (type: undefined)  ← Column missing!
```

---

### **Step 2: Check Database Directly**

Connect to Render PostgreSQL and run:

```sql
-- Check source column exists
\d contacts

-- Check actual values
SELECT email, source, created_at 
FROM contacts 
WHERE user_id = (SELECT id FROM users LIMIT 1)
LIMIT 5;
```

---

## Most Likely Causes

### **Cause A: Source column has NULL values**
- Column exists but is empty
- **Fix:** Run UPDATE query to set source based on mappings

### **Cause B: Source column doesn't exist**
- Migration never ran
- **Fix:** Run ALTER TABLE to add column

### **Cause C: Backend not returning source field**
- API response filtering it out
- **Fix:** Check contacts route serialization

---

## Quick Fix (If Database Has NULL)

If database shows `source = NULL` for all contacts:

```sql
-- Fix all HubSpot contacts
UPDATE contacts 
SET source = 'hubspot' 
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
);

-- Fix all Gmail contacts (those without CRM mappings)
UPDATE contacts 
SET source = 'gmail'
WHERE id NOT IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings
)
AND source IS NULL;

-- Verify
SELECT source, COUNT(*) FROM contacts GROUP BY source;
```

---

**Next:** Run Step 1 debug command and tell me what it shows!
