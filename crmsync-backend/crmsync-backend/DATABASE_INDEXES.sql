-- ============================================
-- CRITICAL PERFORMANCE INDEXES
-- Run this on your PostgreSQL database
-- ============================================

-- These indexes will make queries 10-100x faster!

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Composite index for sync queries (most important!)
CREATE INDEX IF NOT EXISTS idx_contacts_user_updated 
  ON contacts(user_id, updated_at) 
  WHERE deleted_at IS NULL;

-- Composite index for active contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_status 
  ON contacts(user_id, status) 
  WHERE deleted_at IS NULL;

-- CRM integrations indexes
CREATE INDEX IF NOT EXISTS idx_crm_integrations_user_id ON crm_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_user_platform ON crm_integrations(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_expires_at ON crm_integrations(token_expires_at);

-- CRM contact mappings indexes
CREATE INDEX IF NOT EXISTS idx_crm_mappings_contact_id ON crm_contact_mappings(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_mappings_user_platform ON crm_contact_mappings(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_crm_mappings_crm_id ON crm_contact_mappings(crm_contact_id);

-- User exclusions indexes
CREATE INDEX IF NOT EXISTS idx_user_exclusions_user_id ON user_exclusions(user_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================

-- Run this to check:
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('contacts', 'crm_integrations', 'crm_contact_mappings', 'user_exclusions', 'users')
ORDER BY tablename, indexname;

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- Check slow queries:
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Check table sizes:
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
