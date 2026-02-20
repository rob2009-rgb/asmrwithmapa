-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message text NOT NULL,
    stack_trace text,
    severity text DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    context jsonb DEFAULT '{}'::jsonb,
    resolved boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone (even anon/unauthenticated if needed, but let's restrict to auth for now unless we want global logging) to insert.
-- Let's say authenticated users can log errors.
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view error logs" ON public.error_logs
    FOR SELECT TO authenticated
    USING (exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support')));

-- Admins can update logs (to mark resolved)
CREATE POLICY "Admins can update error logs" ON public.error_logs
    FOR UPDATE TO authenticated
    USING (exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support')));
