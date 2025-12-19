-- ============================================
-- MANUAL TIER UPDATE (For Testing)
-- ============================================
-- Use this to manually update a user's tier for testing purposes
-- Replace 'your-email@example.com' with the actual email

-- Update to Pro tier
UPDATE users 
SET subscription_tier = 'pro', 
    subscription_status = 'active',
    contact_limit = -1
WHERE email = 'kamtim518@gmail.com';

-- Update to Business tier
-- UPDATE users 
-- SET subscription_tier = 'business', 
--     subscription_status = 'active',
--     contact_limit = -1
-- WHERE email = 'kamtim518@gmail.com';

-- Update to Free tier (downgrade)
-- UPDATE users 
-- SET subscription_tier = 'free', 
--     subscription_status = 'active',
--     contact_limit = 50
-- WHERE email = 'kamtim518@gmail.com';

-- Check current tier
SELECT email, subscription_tier, subscription_status, contact_limit 
FROM users 
WHERE email = 'kamtim518@gmail.com';
