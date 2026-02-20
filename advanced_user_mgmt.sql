-- 1. Soft Delete Implementation
-- Add deleted_at column to profiles if it doesn't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'deleted_at') then
        alter table public.profiles add column deleted_at timestamp with time zone default null;
    end if;
end $$;

-- 2. RBAC Tables
create table if not exists public.permissions (
    code text primary key, -- e.g., 'USER_DELETE', 'MERCH_MANAGE'
    description text,
    created_at timestamp with time zone default now()
);

alter table public.permissions enable row level security;
create policy "Public read permissions" on public.permissions for select using (true);

create table if not exists public.role_permissions (
    role text, -- Removed FK to profiles(role) as it's not a unique constraint
    permission_code text references public.permissions(code) on delete cascade,
    primary key (role, permission_code)
);

alter table public.role_permissions enable row level security;
create policy "Public read role_permissions" on public.role_permissions for select using (true);

-- 3. Seed Permissions
insert into public.permissions (code, description) values
('USER_READ', 'View user list and details'),
('USER_UPDATE', 'Update user roles'),
('USER_DELETE', 'Soft delete users'),
('USER_RESTORE', 'Restore soft-deleted users'),
('USER_PERMANENT_DELETE', 'Permanently remove users (GDPR)'),
('MERCH_MANAGE', 'Create/Update/Delete merch products'),
('AUDIT_READ', 'View system audit logs'),
('MARKETING_MANAGE', 'Send campaigns and manage subscribers'),
('SUPPORT_MANAGE', 'Reply to and close support tickets')
on conflict (code) do nothing;

-- 4. Seed Role Permissions
-- ADMIN (All access)
insert into public.role_permissions (role, permission_code)
select 'admin', code from public.permissions
on conflict do nothing;

-- SUPPORT (Limited access)
insert into public.role_permissions (role, permission_code) values
('support', 'USER_READ'),
('support', 'SUPPORT_MANAGE'),
('support', 'AUDIT_READ') -- Maybe?
on conflict do nothing;

-- USER (No specialized permissions usually, but maybe 'TICKET_CREATE' if we tracked that here)
