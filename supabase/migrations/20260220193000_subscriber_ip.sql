-- Add signup_ip column to subscribers table for rate limiting
ALTER TABLE subscribers
    ADD COLUMN IF NOT EXISTS signup_ip TEXT;

-- Index to speed up rate-limit queries
CREATE INDEX IF NOT EXISTS idx_subscribers_signup_ip_created_at
    ON subscribers (signup_ip, created_at);
