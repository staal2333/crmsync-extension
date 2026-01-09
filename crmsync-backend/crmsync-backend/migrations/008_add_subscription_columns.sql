-- Add Stripe integration columns to users table
-- This supports subscription management and webhooks

-- Add Stripe customer ID (for webhook identification)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Add subscription status tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

-- Add subscription start and end dates
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

-- Add trial tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

-- Add index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
ON users(stripe_customer_id);

-- Add index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status 
ON users(subscription_status);

-- Comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for webhook identification and billing management';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, canceled, past_due, trialing, inactive';
COMMENT ON COLUMN users.subscription_started_at IS 'When the current subscription period started';
COMMENT ON COLUMN users.subscription_ends_at IS 'When the current subscription period ends (for cancellations)';
COMMENT ON COLUMN users.trial_ends_at IS 'When the free trial ends (14 days from signup)';
