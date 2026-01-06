# Quick Database Fix Script

## How to Run SQL on Render

You were trying to run SQL in bash shell. You need to connect to PostgreSQL first!

### **Method 1: Use PostgreSQL Shell**

```bash
# Connect to database
psql $DATABASE_URL

# Then run these SQL queries:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'source';

SELECT source, COUNT(*) as count 
FROM contacts 
GROUP BY source;
```

### **Method 2: One-Line Command**

```bash
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'source';"

psql $DATABASE_URL -c "SELECT source, COUNT(*) as count FROM contacts GROUP BY source;"
```

---

## Quick Fix (Run This Now)

If the source column exists but has NULL values, run this:

```bash
psql $DATABASE_URL << 'EOF'
-- Fix HubSpot contacts
UPDATE contacts 
SET source = 'hubspot' 
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
)
AND source IS NULL;

-- Fix Gmail contacts (no CRM mapping)
UPDATE contacts 
SET source = 'gmail'
WHERE id NOT IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings
)
AND source IS NULL;

-- Check results
SELECT source, COUNT(*) FROM contacts GROUP BY source;
EOF
```

**Tell me the output!**
