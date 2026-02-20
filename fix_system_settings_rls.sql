-- 1. Reset Policies on system_settings
alter table public.system_settings enable row level security;

drop policy if exists "Admins can manage system settings" on public.system_settings;
drop policy if exists "Admins can view system settings" on public.system_settings;
drop policy if exists "Admins can insert system settings" on public.system_settings;
drop policy if exists "Admins can update system settings" on public.system_settings;

-- 2. Create GRANULAR policies to be safe and explicit

-- SELECT: Admins can view all settings
create policy "Admins can view system settings"
  on public.system_settings for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- INSERT: Admins can insert new settings
create policy "Admins can insert system settings"
  on public.system_settings for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- UPDATE: Admins can update settings
create policy "Admins can update system settings"
  on public.system_settings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- DELETE: Admins can delete settings (if needed)
create policy "Admins can delete system settings"
  on public.system_settings for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Ensure the profiles table is readable (It should be, but just in case)
-- This is critical because the policies above query 'public.profiles'
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

-- 4. Verify/Create Trigger for updated_by (Optional but good)
create or replace function public.handle_setting_update()
returns trigger as $$
begin
  new.updated_at = now();
  -- Only set updated_by if auth.uid() is available (it might be null in some contexts, though unlikely for RLS)
  if auth.uid() is not null then
      new.updated_by = auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_setting_update on public.system_settings;
create trigger on_setting_update
  before update on public.system_settings
  for each row execute procedure public.handle_setting_update();
