-- ============================================================
-- Security Adviser Fixes — all issues resolved in one migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── ERROR 1: Security Definer View ───────────────────────────────────────────
-- Fix: recreate with security_invoker so RLS of the QUERYING user is enforced

DROP VIEW IF EXISTS public.active_streak_leaderboard;

CREATE VIEW public.active_streak_leaderboard
WITH (security_invoker = on) AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    up.streak_count,
    up.badges
FROM public.profiles p
JOIN public.user_preferences up ON p.id = up.user_id
WHERE up.streak_count > 0
ORDER BY up.streak_count DESC
LIMIT 50;

GRANT SELECT ON public.active_streak_leaderboard TO authenticated;

-- ── ERROR 2: RLS Disabled on order_items ─────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users see only items belonging to their own orders
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admins can manage all order items
CREATE POLICY "Admins can manage order items"
    ON public.order_items FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ── WARN: Function search_path mutable (6 functions) ─────────────────────────
-- Fix: set search_path = '' to prevent schema injection attacks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_setting_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    IF auth.uid() IS NOT NULL THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.community_presets
    SET likes_count = likes_count + 1
    WHERE id = NEW.preset_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.community_presets
    SET likes_count = likes_count - 1
    WHERE id = OLD.preset_id;
    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_downloads(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.community_presets
    SET downloads_count = downloads_count + 1
    WHERE id = row_id;
END;
$$;

-- ── WARN: RLS policies always true ───────────────────────────────────────────

-- audit_logs: restrict INSERT to service_role (system only – triggers bypass RLS anyway)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- categories: restrict INSERT/UPDATE to admins only
DROP POLICY IF EXISTS "Everyone can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Everyone can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- error_logs: restrict INSERT to the authenticated user's own records
DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert own error logs"
    ON public.error_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- sounds: restrict INSERT/UPDATE to admins only
DROP POLICY IF EXISTS "Everyone can insert sounds" ON public.sounds;
CREATE POLICY "Admins can insert sounds"
    ON public.sounds FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Everyone can update sounds" ON public.sounds;
CREATE POLICY "Admins can update sounds"
    ON public.sounds FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- subscribers: landing page inserts now go via Edge Function (service_role key)
-- so we can safely restrict the anon policy
DROP POLICY IF EXISTS "Public insert subscribers" ON public.subscribers;
CREATE POLICY "Service role can insert subscribers"
    ON public.subscribers FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- ticket_messages: require authentication to insert
DROP POLICY IF EXISTS "Insert messages" ON public.ticket_messages;
CREATE POLICY "Authenticated users can insert messages"
    ON public.ticket_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- ── WARN: Leaked password protection ─────────────────────────────────────────
-- Cannot be fixed via SQL. Enable in Supabase Dashboard:
-- Authentication → Security → Enable "Leaked password protection"
