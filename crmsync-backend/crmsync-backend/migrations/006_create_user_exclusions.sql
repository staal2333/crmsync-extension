-- Migration: Create user_exclusions table
-- Description: Stores user-specific exclusion rules that follow them across devices
-- Author: CRMSYNC
-- Date: 2026-01-06

-- Create user_exclusions table
CREATE TABLE IF NOT EXISTS user_exclusions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Section 1: User's own identity (to avoid self-tracking)
  exclude_name VARCHAR(255),
  exclude_email VARCHAR(255),
  exclude_phone VARCHAR(100),
  exclude_company VARCHAR(255),
  
  -- Section 2: Team and internal emails
  exclude_domains TEXT[], -- Array of domains like ['@company.com', '@subsidiary.com']
  exclude_emails TEXT[], -- Array of specific emails to ignore
  
  -- Section 3: Behavior toggles
  ignore_signature_matches BOOLEAN DEFAULT true,
  ignore_internal_threads BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_exclusions_user_id ON user_exclusions(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_user_exclusions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_exclusions_updated_at
  BEFORE UPDATE ON user_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_exclusions_updated_at();

-- Add comment
COMMENT ON TABLE user_exclusions IS 'Stores user exclusion rules that apply across all devices';
