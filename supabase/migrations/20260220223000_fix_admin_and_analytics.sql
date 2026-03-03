-- Migration: Fix Admin User Creation and Analytics Tables
-- Date: 2026-02-20

-- 1. Ensure 'updated_at' exists on profiles for UserPanel logic
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Re-assert Analytics Tables (In case 20260220205000_analytics_schema.sql failed or was not pushed)
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_fingerprint TEXT,
    device_type TEXT,
    os TEXT,
    browser TEXT,
    referrer TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    feature_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Delete existing policies to prevent conflicts if re-running
DROP POLICY IF EXISTS "Anyone can insert a session" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Admins can view all analytics sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;

-- Policies for sessions
CREATE POLICY "Anyone can insert a session"
    ON public.analytics_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
    ON public.analytics_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics sessions"
    ON public.analytics_sessions FOR SELECT
    USING ( is_admin() );

-- Policies for events
CREATE POLICY "Anyone can insert analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
    ON public.analytics_events FOR SELECT
    USING ( is_admin() );

-- 3. Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_time ON public.analytics_events(created_at);
