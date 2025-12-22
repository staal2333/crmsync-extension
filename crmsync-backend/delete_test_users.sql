-- =====================================================
-- DELETE TEST USERS FROM DATABASE
-- =====================================================
-- Run this in Render Shell: psql $DATABASE_URL < delete_test_users.sql
-- Or copy-paste into Render SQL Query interface

-- OPTION 1: Delete specific test users
-- Replace with your actual test email addresses

DELETE FROM crm_sync_logs 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN (
    'test@example.com',
    'admin@example.com',
    'demo@example.com'
    -- Add more test emails here
  )
);

DELETE FROM crm_contact_mappings 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN (
    'test@example.com',
    'admin@example.com',
    'demo@example.com'
  )
);

DELETE FROM crm_integrations 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN (
    'test@example.com',
    'admin@example.com',
    'demo@example.com'
  )
);

DELETE FROM contacts 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email IN (
    'test@example.com',
    'admin@example.com',
    'demo@example.com'
  )
);

DELETE FROM users 
WHERE email IN (
  'test@example.com',
  'admin@example.com',
  'demo@example.com'
);

-- Verify deletion
SELECT 'Remaining users:' as status;
SELECT id, email, display_name, created_at FROM users;

-- =====================================================
-- OPTION 2: Nuclear - Delete ALL users (use with caution!)
-- =====================================================
-- Uncomment below to delete everything

-- TRUNCATE TABLE crm_sync_logs CASCADE;
-- TRUNCATE TABLE crm_contact_mappings CASCADE;
-- TRUNCATE TABLE crm_integrations CASCADE;
-- TRUNCATE TABLE contacts CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- SELECT 'All users deleted!' as status;
-- SELECT COUNT(*) as remaining_users FROM users;
