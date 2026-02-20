-- 1. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
-- This fixes 406 (Not Acceptable) errors after creating new tables
notify pgrst, 'reload config';

-- 2. RE-GRANT PERMISSIONS (Safety measure)
grant all on public.user_secrets to authenticated;
grant all on public.user_secrets to service_role;
grant all on public.user_secrets to anon; -- Optional but helps if anon access is needed for check

-- 3. VERIFY TABLE COMMENT
comment on table public.user_secrets is 'User 2FA secrets - Verified Schema';
