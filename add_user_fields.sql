-- Add new fields for Advanced User Management

-- 1. Add subscription_tier (default 'free')
alter table public.profiles 
add column if not exists subscription_tier text default 'free';

-- 2. Add full_name
alter table public.profiles 
add column if not exists full_name text;

-- 3. Add last_sign_in_at (Sync from Auth for easier display)
alter table public.profiles 
add column if not exists last_sign_in_at timestamp with time zone;

-- 4. Update handle_new_user trigger to include these defaults if needed
-- (Supabase might handle defaults automatically, but good to be safe)

comment on column public.profiles.subscription_tier is 'free, paid, vip, etc.';
