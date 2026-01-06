# Database Source Check

## Quick Database Verification

We need to verify the database has:
1. ✅ `source` column exists in `contacts` table
2. ✅ Contacts have correct source values (`hubspot`, not `crm-sync`)

---

## Run These SQL Commands

**Connect to your Render database:**
1. Go to https://dashboard.render.com
2. Find your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Or use the Shell in your backend service

**Then run:**

```sql
-- 1. Check if source column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'source';

-- 2. Check actual source values
SELECT source, COUNT(*) as count 
FROM contacts 
GROUP BY source 
ORDER BY count DESC;

-- 3. Sample some contacts to see their data
SELECT id, email, source, created_at, updated_at
FROM contacts 
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE')
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check if mappings exist for these contacts
SELECT 
  c.email,
  c.source as contact_source,
  m.platform as mapping_platform,
  m.crm_contact_id
FROM contacts c
LEFT JOIN crm_contact_mappings m ON c.id = m.contact_id
WHERE c.user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE')
LIMIT 10;
```

---

## What to Look For

### ✅ Good Results:
```
source   | count
---------|------
hubspot  | 450
gmail    | 20
```

### ❌ Bad Results:
```
source     | count
-----------|------
crm-sync   | 450   ← WRONG!
NULL       | 450   ← WRONG!
```

---

## If Source is Wrong

If most contacts show `NULL` or `crm-sync`, we need to re-run the migration:

```sql
-- Fix existing contacts
UPDATE contacts 
SET source = 'hubspot' 
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
) 
AND (source IS NULL OR source = 'crm-sync');

-- Verify fix
SELECT source, COUNT(*) 
FROM contacts 
GROUP BY source;
```

**Tell me what the query results show!**
