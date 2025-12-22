-- =====================================================
-- CRM INTEGRATIONS DATABASE SCHEMA
-- =====================================================
-- This migration adds support for HubSpot and Salesforce integrations
-- Run this before deploying the integration features

-- Table 1: Store OAuth tokens and integration settings
CREATE TABLE IF NOT EXISTS crm_integrations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('hubspot', 'salesforce')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  instance_url VARCHAR(255), -- For Salesforce (e.g., https://na123.salesforce.com)
  portal_id VARCHAR(255), -- For HubSpot portal/account ID
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Store custom settings (field mappings, preferences, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_platform UNIQUE(user_id, platform)
);

-- Table 2: Map our contacts to CRM contacts (for status badges)
CREATE TABLE IF NOT EXISTS crm_contact_mappings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('hubspot', 'salesforce')),
  crm_contact_id VARCHAR(255) NOT NULL, -- ID of contact in the CRM
  crm_record_type VARCHAR(50), -- For Salesforce: 'Contact' or 'Lead'
  last_synced TIMESTAMP DEFAULT NOW(),
  sync_direction VARCHAR(20) DEFAULT 'push', -- 'push' or 'pull'
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_mapping UNIQUE(user_id, contact_id, platform)
);

-- Table 3: Log all sync operations for debugging and analytics
CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'duplicate', 'sync_all'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'skipped'
  crm_contact_id VARCHAR(255), -- ID in the CRM
  error_message TEXT,
  metadata JSONB, -- Store additional info (response data, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_integrations_user ON crm_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_platform ON crm_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_active ON crm_integrations(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_mappings_user ON crm_contact_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_mappings_contact ON crm_contact_mappings(contact_id);
CREATE INDEX IF NOT EXISTS idx_mappings_user_contact ON crm_contact_mappings(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_mappings_platform ON crm_contact_mappings(platform);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user ON crm_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_contact ON crm_sync_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_platform ON crm_sync_logs(platform);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON crm_sync_logs(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE crm_integrations IS 'Stores OAuth tokens and settings for CRM integrations (HubSpot, Salesforce)';
COMMENT ON TABLE crm_contact_mappings IS 'Maps our contacts to contacts in external CRMs for duplicate detection';
COMMENT ON TABLE crm_sync_logs IS 'Audit log of all CRM sync operations';

COMMENT ON COLUMN crm_integrations.portal_id IS 'HubSpot portal/account ID';
COMMENT ON COLUMN crm_integrations.instance_url IS 'Salesforce instance URL (e.g., https://na123.salesforce.com)';
COMMENT ON COLUMN crm_contact_mappings.crm_record_type IS 'For Salesforce: Contact or Lead';
COMMENT ON COLUMN crm_contact_mappings.sync_direction IS 'Whether contact was pushed to CRM or pulled from CRM';
