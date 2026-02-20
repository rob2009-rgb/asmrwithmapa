-- PERMANENT SECURITY FIX
-- The issue: "Recursion" or "Privilege" errors when checking policies.
-- The Solution: A "Security Definer" function that safely checks if you are an admin.

-- 1. Create is_admin() function
-- This function runs with "superuser" privileges (Security Definer), 
-- allowing it to read the profiles table even if RLS would normally block it.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer 
set search_path = public -- Good practice for security definers
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 2. Re-Enable RLS and Apply Robust Policies
alter table public.system_settings enable row level security;

-- Drop old policies to be clean
drop policy if exists "Admins can manage system settings" on public.system_settings;
drop policy if exists "Admins can view system settings" on public.system_settings;
drop policy if exists "Admins can insert system settings" on public.system_settings;
drop policy if exists "Admins can update system settings" on public.system_settings;
drop policy if exists "Admins can delete system settings" on public.system_settings;

-- Create New Policies using is_admin()
create policy "Admins can view system settings"
  on public.system_settings for select
  using ( is_admin() );

create policy "Admins can insert system settings"
  on public.system_settings for insert
  with check ( is_admin() );

create policy "Admins can update system settings"
  on public.system_settings for update
  using ( is_admin() );

create policy "Admins can delete system settings"
  on public.system_settings for delete
  using ( is_admin() );

-- 3. Fix Profiles Policies as well (Use the same robust check)
drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles" 
  on public.profiles for insert
  with check ( is_admin() );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" 
  on public.profiles for update 
  using ( is_admin() );

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" 
  on public.profiles for delete 
  using ( is_admin() );
