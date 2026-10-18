-- Where each product came from and what it was listed at (admin-only).
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Supplier costs must never be public, so there is NO public read policy.

create table if not exists public.product_sourcing (
  product_id    text primary key references public.products(id) on delete cascade,
  supplier      text not null,
  supplier_phone text,                         -- supplier's WhatsApp number, 2547XXXXXXXX
  supplier_cost integer,                       -- what the supplier quoted (null if unknown)
  listed_price  integer not null,              -- price the product was first listed at
  source_ref    text,                          -- chat export / group it was read from
  listed_at     timestamptz not null default now()
);

create index if not exists product_sourcing_supplier_idx on public.product_sourcing (supplier);

alter table public.product_sourcing enable row level security;

drop policy if exists "Admins can manage product sourcing" on public.product_sourcing;
create policy "Admins can manage product sourcing"
  on public.product_sourcing for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Added later: if the table already exists, this adds the supplier phone column.
alter table public.product_sourcing add column if not exists supplier_phone text;
