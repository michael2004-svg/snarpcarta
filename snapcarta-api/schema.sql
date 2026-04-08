-- Snapcarta schema for Supabase (public)

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  "firstName" text not null,
  "lastName" text not null,
  email text unique not null,
  password text not null,
  role text not null default 'user' check (role in ('user','admin')),
  phone text,
  address text,
  city text,
  country text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  "originalPrice" numeric(10,2) not null,
  image text not null,
  images text[] default '{}'::text[],
  specs jsonb default '{}'::jsonb,
  "categoryId" uuid references public.categories(id) on delete set null,
  "aliexpressId" text,
  rating numeric(3,2) not null default 0,
  "reviewCount" integer not null default 0,
  "inStock" boolean not null default true,
  stock integer not null default 0,
  badge text check (badge in ('hot','new','sale')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists idx_products_category on public.products("categoryId");
create index if not exists idx_products_badge on public.products(badge);
create index if not exists idx_products_created on public.products("createdAt");

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.users(id) on delete cascade,
  "productId" uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_cart_user on public.cart_items("userId");

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  "orderNumber" text unique not null,
  "userId" uuid references public.users(id),
  subtotal numeric(10,2) not null,
  "shippingCost" numeric(10,2) not null default 4.99,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in (
    'pending','processing','paid','shipped','delivered','cancelled','refunded'
  )),
  "paymentMethod" text not null check (paymentMethod in ('stripe','paypal','mpesa')),
  "paymentId" text,
  "trackingNumber" text,
  "shippingAddress" jsonb not null,
  "aliexpressOrderId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  "orderId" uuid not null references public.orders(id) on delete cascade,
  "productId" uuid not null references public.products(id),
  quantity integer not null,
  "priceAtPurchase" numeric(10,2) not null,
  "aliexpressProductId" text
);

create index if not exists idx_order_items_order on public.order_items("orderId");

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  "minPrice" numeric(10,2) not null,
  "maxPrice" numeric(10,2) not null,
  multiplier numeric(4,2) not null,
  description text
);

-- RLS helpers (optional). Uncomment if using anon key.
-- alter table public.products enable row level security;
-- alter table public.categories enable row level security;
-- create policy "public read products"
-- on public.products for select
-- using (true);
-- create policy "public read categories"
-- on public.categories for select
-- using (true);

-- Scraped products queue (for admin review)
create or replace function public.set_updated_at_snake()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.scraped_products (
  id uuid primary key default gen_random_uuid(),
  source_url text unique not null,
  aliexpress_id text,
  title text,
  price_min numeric(10,2),
  price_max numeric(10,2),
  currency text not null default 'USD',
  images text[] default '{}'::text[],
  description text,
  variants jsonb default '[]'::jsonb,
  rating numeric(3,2),
  review_count integer,
  seller_name text,
  in_stock boolean not null default true,
  affiliate_url text,
  raw_data jsonb,
  status text not null default 'pending' check (status in ('pending','added','skipped')),
  scraped_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_scraped_products_updated_at
before update on public.scraped_products
for each row execute function public.set_updated_at_snake();

create index if not exists idx_scraped_products_status on public.scraped_products(status);
