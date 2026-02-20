-- Migration to support GDPR compliance
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT;

-- Index for faster token lookups during unsubscribe flow
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers (unsubscribe_token);
