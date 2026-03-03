-- Allow public/authenticated read access to specific mobile configuration keys
-- We only whitelist keys that are safe to be read by the client app.

create policy "Whitelisted mobile settings are viewable by users"
  on public.system_settings for select
  to authenticated
  using (
    key in (
      'revenuecat_apple_key', 
      'revenuecat_android_key',
      'fourthwall_token'
    )
  );

-- Ensure we have the keys initialized (optional, but prevents empty state)
insert into public.system_settings (key, value, description)
values 
  ('revenuecat_apple_key', '', 'RevenueCat API Key for iOS'),
  ('revenuecat_android_key', '', 'RevenueCat API Key for Android')
on conflict (key) do nothing;
