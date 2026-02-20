-- Create a table to store user 2FA secrets
-- This table should be secure and only accessible by the user themselves

create table if not exists public.user_secrets (
  id uuid references auth.users on delete cascade not null primary key,
  mfa_secret text,
  mfa_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_secrets enable row level security;

-- Create policies
create policy "Users can view their own secrets" on public.user_secrets
  for select using (auth.uid() = id);

create policy "Users can update their own secrets" on public.user_secrets
  for update using (auth.uid() = id);

create policy "Users can insert their own secrets" on public.user_secrets
  for insert with check (auth.uid() = id);

-- Grant access to authenticated users
grant all on public.user_secrets to authenticated;
grant all on public.user_secrets to service_role;
