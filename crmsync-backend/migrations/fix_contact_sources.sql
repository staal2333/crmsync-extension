-- =====================================================
-- FIX: Update source for existing imported contacts
-- =====================================================
-- This fixes contacts imported from HubSpot/Salesforce that have source='crm-sync'
-- Run this on your production database AFTER running the fix_crm_sync_logs.sql migration

-- Step 1: Update contacts that have HubSpot mappings to source='hubspot'
UPDATE contacts
SET source = 'hubspot'
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'hubspot'
)
AND (source IS NULL OR source = 'crm-sync' OR source = 'gmail');

-- Step 2: Update contacts that have Salesforce mappings to source='salesforce'
UPDATE contacts
SET source = 'salesforce'
WHERE id IN (
  SELECT DISTINCT contact_id 
  FROM crm_contact_mappings 
  WHERE platform = 'salesforce'
)
AND (source IS NULL OR source = 'crm-sync' OR source = 'gmail');

-- Step 3: Verify the changes
SELECT 
  c.source,
  COUNT(*) as contact_count,
  COUNT(DISTINCT ccm.platform) as has_crm_mapping
FROM contacts c
LEFT JOIN crm_contact_mappings ccm ON c.id = ccm.contact_id
GROUP BY c.source
ORDER BY contact_count DESC;

-- Success message
SELECT 'Migration complete! Contacts now have correct source labels.' AS status;
