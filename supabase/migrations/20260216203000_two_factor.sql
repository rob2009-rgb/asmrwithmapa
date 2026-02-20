-- Create a table to store user MFA secrets separately from profiles for better security
create table if not exists public.user_secrets (
    id uuid references auth.users on delete cascade primary key,
    mfa_secret text,
    mfa_enabled boolean default false,
    backup_codes text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_secrets enable row level security;

-- Policies
create policy "Users can view their own secrets"
    on public.user_secrets for select
    using (auth.uid() = id);

create policy "Users can insert their own secrets"
    on public.user_secrets for insert
    with check (auth.uid() = id);

create policy "Users can update their own secrets"
    on public.user_secrets for update
    using (auth.uid() = id);

-- Trigger to handle updated_at
create trigger handle_updated_at before update on public.user_secrets
    for each row execute procedure moddatetime (updated_at);
