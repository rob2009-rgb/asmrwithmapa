-- ============================================================
-- Landing Page Subscribers Schema
-- Run this in your SEPARATE "landing" Supabase project
-- (NOT in the main app's Supabase project)
-- ============================================================

-- Subscribers table
create table if not exists public.subscribers (
    id          uuid primary key default gen_random_uuid(),
    email       text not null,
    source      text not null default 'landing_page',   -- e.g. 'landing_page', 'hero', 'footer'
    is_active   boolean not null default true,
    created_at  timestamptz not null default now(),
    -- future integration fields (populated when merging into main app)
    synced_to_main_app boolean default false,
    synced_at          timestamptz
);

-- Unique on email (upsert-safe)
create unique index if not exists subscribers_email_idx on public.subscribers (lower(email));

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.subscribers enable row level security;

-- Allow anyone to INSERT (anonymous sign-up from landing page)
create policy "Allow public insert"
    on public.subscribers
    for insert
    to anon
    with check (true);

-- Only authenticated users (admin) can read or update
create policy "Allow authenticated read"
    on public.subscribers
    for select
    to authenticated
    using (true);

create policy "Allow authenticated update"
    on public.subscribers
    for update
    to authenticated
    using (true);

-- ── Rate-limiting guard: pg function to block >5 inserts per IP per hour ──
-- NOTE: Supabase does not expose IP in RLS by default; this is an optional
-- server-side extension. For basic protection, enable Supabase's built-in
-- API rate limiting in the project settings (Settings → API → Rate Limits).

-- ── Audit log trigger ──────────────────────────────────────────────────────

create table if not exists public.subscriber_audit (
    id          uuid primary key default gen_random_uuid(),
    email       text,
    action      text,  -- 'insert' | 'update' | 'deactivate'
    occurred_at timestamptz default now()
);

create or replace function public.log_subscriber_change()
returns trigger language plpgsql as $$
begin
    insert into public.subscriber_audit (email, action)
    values (new.email, lower(tg_op));
    return new;
end;
$$;

create trigger subscriber_audit_trigger
after insert or update on public.subscribers
for each row execute function public.log_subscriber_change();

-- ── Future integration helper ───────────────────────────────────────────────
-- When ready to merge into the main app, run:
--
--   select email, source, created_at
--   from subscribers
--   where is_active = true
--   order by created_at;
--
-- And import into the main app's subscribers table via CSV or the Supabase
-- management API. Then set synced_to_main_app = true on migrated rows.
