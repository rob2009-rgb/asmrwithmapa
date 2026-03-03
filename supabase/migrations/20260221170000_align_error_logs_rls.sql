-- Allow anyone to report an error (blind insert)
-- This ensures that technical failures on the landing page for anonymous users are still captured.
DROP POLICY IF EXISTS "Anyone can report errors" ON public.error_logs;
CREATE POLICY "Anyone can report errors" ON public.error_logs
    FOR INSERT WITH CHECK (true);
