-- 1. Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'support', 'user')),
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

-- 2. Products Table (Merch)
create table public.products (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  image_url text,
  stock_count integer not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  constraint products_pkey primary key (id)
);

-- 3. Orders Table
create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total numeric not null default 0,
  shipping_address jsonb,
  created_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id)
);

-- 4. Order Items (Link Products to Orders)
create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null default 1,
  price_at_time numeric not null,
  constraint order_items_pkey primary key (id)
);

-- 5. Audit Logs (Security)
create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid references auth.users(id),
  action text not null,
  resource text not null,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone not null default now(),
  constraint audit_logs_pkey primary key (id)
);

-- 6. RLS Policies

-- PROFILES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- PRODUCTS
alter table public.products enable row level security;
create policy "Products are viewable by everyone" on public.products for select using (true);
create policy "Admins can insert products" on public.products for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update products" on public.products for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ORDERS
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Admins can view all orders" on public.orders for select using (exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'support')));
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = user_id);

-- AUDIT LOGS
alter table public.audit_logs enable row level security;
create policy "Admins can view audit logs" on public.audit_logs for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "System can insert audit logs" on public.audit_logs for insert with check (true);

-- 7. Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Seed Initial Merch
insert into public.products (name, description, price, image_url, stock_count) values
('Bubblegum Pink Hoodie', 'Ultra-soft cotton hoodie.', 45.00, 'https://picsum.photos/seed/hoodie/400/500', 100),
('MAPA Mug', 'The perfect companion for your nightly routine.', 18.00, 'https://picsum.photos/seed/mug/400/500', 50),
('Exclusive Stickers', 'Glossy trigger stickers.', 12.00, 'https://picsum.photos/seed/sticker/400/500', 200);
