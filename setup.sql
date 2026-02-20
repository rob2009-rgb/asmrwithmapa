-- 1. Create Tables
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  icon text not null,
  color text not null,
  description text null,
  is_premium boolean null default false,
  created_at timestamp with time zone not null default now(),
  order_index numeric null,
  constraint categories_pkey primary key (id)
);

create table public.sounds (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,
  name text not null,
  url text not null,
  created_at timestamp with time zone not null default now(),
  is_premium boolean null default false,
  constraint sounds_pkey primary key (id),
  constraint sounds_category_id_fkey foreign key (category_id) references categories (id)
);

-- 2. Enable Storage (if not already)
-- This usually requires the storage extension, but buckets are inserted into storage.buckets
insert into storage.buckets (id, name, public)
values ('sounds', 'sounds', true);

-- 3. Row Level Security (RLS) Policies
-- Allow public read access
alter table public.categories enable row level security;
create policy "Public categories are viewable by everyone" on public.categories for select using (true);
create policy "Everyone can insert categories (Demo)" on public.categories for insert with check (true);
create policy "Everyone can update categories (Demo)" on public.categories for update using (true);

alter table public.sounds enable row level security;
create policy "Public sounds are viewable by everyone" on public.sounds for select using (true);
create policy "Everyone can insert sounds (Demo)" on public.sounds for insert with check (true);
create policy "Everyone can update sounds (Demo)" on public.sounds for update using (true);

-- Storage Policies
create policy "Public Access" on storage.objects for select using ( bucket_id = 'sounds' );
create policy "Public Upload" on storage.objects for insert with check ( bucket_id = 'sounds' );

-- 4. Initial Data (Optional - Water Sounds)
insert into public.categories (name, icon, color, description, order_index)
values 
('Water', '💧', 'bg-blue-200', 'Rain, Ocean, and Rivers', 0),
('Tapping', '🖐️', 'bg-amber-200', 'Wood, Glass, and Plastic', 1);
