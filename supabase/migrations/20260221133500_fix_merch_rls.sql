-- Allow anyone to read the Fourthwall token and Merch Banner
-- This ensures non-admin users (on mobile or web) can load live products.
-- Sensitive keys (supabase_service_role_key, resend_api_key) remain Admin-only.

CREATE POLICY "Public can view non-sensitive system settings"
ON public.system_settings
FOR SELECT
USING (
  key IN ('fourthwall_token', 'merch_banner')
);
