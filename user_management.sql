-- 1. Grant Admins permission to update profiles (to change roles)
-- Note: The original security_merch.sql only allowed users to update their OWN profile.
-- We need to add a policy for Admins.

drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Admins can update any profile" on public.profiles 
  for update 
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Allow Admins to delete profiles (Ban/Remove user)
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Admins can delete profiles" on public.profiles 
  for delete 
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Ensure SELECT permission exists (Crucial for Admin View)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Public profiles are viewable by everyone" on public.profiles 
  for select 
  using (true);

-- 4. Enable RLS (just in case it was disabled)
alter table public.profiles enable row level security;

-- 5. Audit Logs Policies
alter table public.audit_logs enable row level security;

-- Logs are viewable by Admins only
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Logs can be inserted by Admins and System (if user_id matches)
-- Ideally backend only, but for client-side admin panel:
drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can insert audit logs" on public.audit_logs
  for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
