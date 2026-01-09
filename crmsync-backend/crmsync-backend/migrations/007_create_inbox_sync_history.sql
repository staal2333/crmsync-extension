-- Migration: Create inbox_sync_history table
-- Description: Tracks inbox sync sessions for users

CREATE TABLE IF NOT EXISTS inbox_sync_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
  emails_scanned INTEGER DEFAULT 0,
  contacts_found INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  contacts_created INTEGER DEFAULT 0,
  options JSONB, -- Sync options (dateRange, platforms, etc.)
  results JSONB, -- Detailed results
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_inbox_sync_history_user_id ON inbox_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_sync_history_started_at ON inbox_sync_history(started_at DESC);

-- Add google_access_token column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP;

COMMENT ON TABLE inbox_sync_history IS 'Tracks full inbox sync sessions for Pro users';
COMMENT ON COLUMN inbox_sync_history.options IS 'JSON object with sync options (dateRange, updateExisting, etc.)';
COMMENT ON COLUMN inbox_sync_history.results IS 'JSON object with detailed sync results (errors, skipped contacts, etc.)';
