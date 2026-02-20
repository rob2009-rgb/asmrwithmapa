-- RESET SCHEMA (Idempotency)
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 1. SUPPORT SYSTEM
-- Tickets Table
create table public.tickets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references public.profiles(id),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  category text default 'general',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tickets_pkey primary key (id)
);

-- Ticket Messages (Conversation)
create table public.ticket_messages (
  id uuid not null default gen_random_uuid (),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  message text not null,
  is_staff_reply boolean default false,
  created_at timestamp with time zone not null default now(),
  constraint ticket_messages_pkey primary key (id)
);

-- 2. MARKETING SYSTEM
-- Subscribers
create table public.subscribers (
  id uuid not null default gen_random_uuid (),
  email text not null unique,
  is_active boolean default true,
  source text default 'signup_form',
  created_at timestamp with time zone not null default now(),
  constraint subscribers_pkey primary key (id)
);

-- Email Templates (Editable Automations)
create table public.email_templates (
  id uuid not null default gen_random_uuid (),
  name text not null unique, -- e.g. 'welcome_email', 'new_video_alert'
  subject_template text not null,
  body_template text not null, -- Supports placeholders like {{name}}
  description text,
  is_active boolean default true,
  updated_at timestamp with time zone not null default now(),
  constraint email_templates_pkey primary key (id)
);

-- Campaigns (Newsletters)
create table public.campaigns (
  id uuid not null default gen_random_uuid (),
  subject text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  target_audience text default 'all' check (target_audience in ('all', 'premium', 'free')),
  sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint campaigns_pkey primary key (id)
);

-- 3. NOTIFICATIONS
create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, -- 'video', 'order', 'system', 'ticket'
  link text,
  is_read boolean default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id)
);

-- 4. RLS POLICIES

-- Tickets
alter table public.tickets enable row level security;
create policy "Users view own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "Admins/Support view all tickets" on public.tickets for select using (exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support')));
create policy "Users create tickets" on public.tickets for insert with check (auth.uid() = user_id);
create policy "Admins/Support update tickets" on public.tickets for update using (exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support')));

-- Ticket Messages
alter table public.ticket_messages enable row level security;
create policy "View messages for own ticket or admin" on public.ticket_messages for select using (
  exists (select 1 from public.tickets where id = ticket_id and user_id = auth.uid()) OR
  exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support'))
);
create policy "Insert messages" on public.ticket_messages for insert with check (true); -- Simplified, ideally check ticket ownership

-- Subscribers
alter table public.subscribers enable row level security;
create policy "Admins view subscribers" on public.subscribers for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Public insert subscribers" on public.subscribers for insert with check (true);

-- Templates & Campaigns (Admin Only)
alter table public.email_templates enable row level security;
alter table public.campaigns enable row level security;
create policy "Admins manage templates" on public.email_templates for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage campaigns" on public.campaigns for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Notifications
alter table public.notifications enable row level security;
create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Admins create notifications" on public.notifications for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. SEED DEFAULT TEMPLATES
insert into public.email_templates (name, subject_template, body_template, description) values
('welcome_email', 'Welcome to ASMR with MAPA! 🌙', 'Hi {{name}},\n\nThanks for joining our relaxation community. Check out our latest videos!', 'Sent automatically on signup'),
('new_video_alert', 'New Video: {{video_title}}', 'Hey {{name}},\n\nI just uploaded a new video: {{video_title}}.\n\nWatch it here: {{video_link}}\n\nRelax well,\nMapa', 'Sent when admin clicks Notify All'),
('order_confirmation', 'Order #{{order_id}} Confirmed', 'Hi {{name}},\n\nYour order for {{product_summary}} has been received!', 'Sent on merch purchase');
