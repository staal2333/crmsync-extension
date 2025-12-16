-- ============================================
-- CRMSYNC Subscription System Migration
-- Version: 2.0
-- Description: Adds subscription management fields and tables
-- ============================================

-- Add subscription fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS contact_limit INTEGER DEFAULT 50;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
  ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription 
  ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier 
  ON users(subscription_tier);

-- Create subscription events log table (for debugging/auditing)
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255) UNIQUE,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user 
  ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type 
  ON subscription_events(event_type);

-- Create usage tracking table (for rate limiting and quotas)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INTEGER DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_metric 
  ON usage_tracking(user_id, metric_name, period_start);

-- Update existing users to have default free tier limits
UPDATE users 
SET contact_limit = 50 
WHERE contact_limit IS NULL AND subscription_tier = 'free';

UPDATE users 
SET contact_limit = -1 
WHERE contact_limit IS NULL AND subscription_tier IN ('pro', 'business', 'enterprise');

-- Add comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN users.subscription_status IS 'Status: active, past_due, cancelled, trialing';
COMMENT ON COLUMN users.contact_limit IS 'Maximum contacts allowed (-1 = unlimited)';

COMMENT ON TABLE subscription_events IS 'Audit log of all subscription-related events from Stripe';
COMMENT ON TABLE usage_tracking IS 'Tracks usage metrics for rate limiting and quota enforcement';

