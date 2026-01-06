-- =====================================================
-- FIX: Add missing crm_contact_id column to crm_sync_logs
-- =====================================================
-- This fixes the error: column "crm_contact_id" of relation "crm_sync_logs" does not exist
-- Run this on your production database

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_sync_logs' 
        AND column_name = 'crm_contact_id'
    ) THEN
        ALTER TABLE crm_sync_logs ADD COLUMN crm_contact_id VARCHAR(255);
        RAISE NOTICE 'Added crm_contact_id column to crm_sync_logs';
    ELSE
        RAISE NOTICE 'crm_contact_id column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'crm_sync_logs'
ORDER BY ordinal_position;

-- Success message
SELECT 'Migration complete! You can now push contacts to HubSpot.' AS status;
