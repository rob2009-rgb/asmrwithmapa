
-- Fix user_secrets table and policies (Safe Run)

-- 1. Create table if it doesn't exist
create table if not exists public.user_secrets (
  id uuid references auth.users on delete cascade not null primary key,
  mfa_secret text,
  mfa_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own secrets" on public.user_secrets;
drop policy if exists "Users can update their own secrets" on public.user_secrets;
drop policy if exists "Users can insert their own secrets" on public.user_secrets;

-- 3. Enable RLS
alter table public.user_secrets enable row level security;

-- 4. Re-create policies
create policy "Users can view their own secrets" on public.user_secrets
  for select using (auth.uid() = id);

create policy "Users can update their own secrets" on public.user_secrets
  for update using (auth.uid() = id);

create policy "Users can insert their own secrets" on public.user_secrets
  for insert with check (auth.uid() = id);

-- 5. Grant permissions
grant all on public.user_secrets to authenticated;
grant all on public.user_secrets to service_role;
