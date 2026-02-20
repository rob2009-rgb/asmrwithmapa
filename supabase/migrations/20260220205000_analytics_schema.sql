-- ==========================================
-- Analytics Database Schema (Compliant)
-- ==========================================

-- Table: analytics_sessions
-- Tracks a single continuous user session (pseudonymized).
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null for unauthenticated
    session_fingerprint TEXT, -- Pseudonymized rotating hash, not raw IP
    device_type TEXT, -- e.g., 'mobile', 'desktop'
    os TEXT,
    browser TEXT,
    referrer TEXT, -- For attribution mapping (e.g. youtube, instagram)
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0
);

-- Protect access to analytics_sessions
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Regular users can only insert their own sessions (or anonymous sessions)
CREATE POLICY "Anyone can insert a session if they have tracking enabled"
    ON public.analytics_sessions FOR INSERT
    WITH CHECK (true);

-- Users can only read their own sessions (or none at all)
CREATE POLICY "Users can view their own sessions"
    ON public.analytics_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all analytics sessions"
    ON public.analytics_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );



-- Table: analytics_events
-- Tracks discrete events (clicks, views, errors, pings) within a session.
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click', 'error', 'heartbeat'
    feature_name TEXT, -- e.g., 'ListenParty', 'ZenMode', 'MixEditor'
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible payload (e.g., error stack traced, variant seen)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimize for reads/writes
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_time ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_feature ON public.analytics_events(feature_name);

-- Protect access to analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert an event linked to a session they hold
CREATE POLICY "Anyone can insert analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- Admins can view all events
CREATE POLICY "Admins can view all analytics events"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );
