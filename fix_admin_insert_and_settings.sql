-- 1. Fix Admin Insert Policy for Profiles
drop policy if exists "Admins can insert profiles" on public.profiles;

create policy "Admins can insert profiles" on public.profiles
  for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Create System Settings Table (Key-Value Store for Secrets/Config)
create table if not exists public.system_settings (
    key text primary key,
    value text,
    description text,
    updated_at timestamp with time zone default now(),
    updated_by uuid references public.profiles(id)
);

-- Enable RLS
alter table public.system_settings enable row level security;

-- Admins can do everything
create policy "Admins can manage system settings" on public.system_settings
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Helper function to update updated_by automatically
create or replace function public.handle_setting_update()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_setting_update on public.system_settings;
create trigger on_setting_update
  before update on public.system_settings
  for each row execute procedure public.handle_setting_update();

-- Seed Fourthwall Setting (Empty initially)
insert into public.system_settings (key, value, description)
values ('fourthwall_token', '', 'Storefront Token for Fourthwall Integration')
on conflict (key) do nothing;
