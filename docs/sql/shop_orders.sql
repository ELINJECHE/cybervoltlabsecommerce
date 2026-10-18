-- Every checkout (guest or logged in) for the admin Orders page.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Separate from public.orders on purpose: that table drives loyalty points and
-- requires a customer account. This one is the shop's order book. The Google
-- Sheets webhook keeps running alongside it as a backup copy.
--
-- Who can do what:
--   * any visitor can INSERT an order (that's checkout), always landing as
--     'awaiting_payment' with no payment details;
--   * customers report an M-Pesa code only through claim_order_payment() below;
--   * only admins can read, update or delete. Customer phones and addresses are
--     never readable by the public.

create table if not exists public.shop_orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique check (char_length(reference) <= 40),
  customer_id       uuid references public.profiles (id) on delete set null,
  customer_name     text not null check (char_length(customer_name) <= 200),
  phone             text not null check (char_length(phone) <= 40),
  delivery_address  text not null check (char_length(delivery_address) <= 1000),
  delivery_area     text check (char_length(delivery_area) <= 200),
  delivery_fee      integer not null default 0,
  pay_on_delivery   boolean not null default false,
  subtotal          integer not null,
  total             integer not null,
  items             jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100),
  notes             text check (char_length(notes) <= 2000),
  status            text not null default 'awaiting_payment'
                    check (status in ('awaiting_payment', 'payment_claimed', 'paid', 'dispatched', 'delivered', 'cancelled')),
  mpesa_code        text,
  paid_amount       integer,
  paid_from_phone   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists shop_orders_created_idx on public.shop_orders (created_at desc);
create index if not exists shop_orders_status_idx on public.shop_orders (status);

-- Whatever the browser sends, a new order starts unpaid and belongs to the
-- signed-in customer (or nobody).
create or replace function public.shop_orders_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.status := 'awaiting_payment';
  new.mpesa_code := null;
  new.paid_amount := null;
  new.paid_from_phone := null;
  new.customer_id := auth.uid();
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shop_orders_before_insert on public.shop_orders;
create trigger shop_orders_before_insert
  before insert on public.shop_orders
  for each row execute procedure public.shop_orders_before_insert();

alter table public.shop_orders enable row level security;

drop policy if exists "Anyone can place an order" on public.shop_orders;
create policy "Anyone can place an order"
  on public.shop_orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can manage orders" on public.shop_orders;
create policy "Admins can manage orders"
  on public.shop_orders for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Called from the payment step: attaches the customer's M-Pesa code to their
-- order. Only works on an unpaid order from the last 3 days, and only moves it
-- to 'payment_claimed': staff still check the code against the Till statement
-- before marking it 'paid'.
create or replace function public.claim_order_payment(
  p_reference text, p_mpesa_code text, p_amount integer, p_from_phone text
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  update public.shop_orders
     set status = 'payment_claimed',
         mpesa_code = left(upper(p_mpesa_code), 20),
         paid_amount = p_amount,
         paid_from_phone = left(p_from_phone, 40),
         updated_at = now()
   where reference = p_reference
     and status = 'awaiting_payment'
     and created_at > now() - interval '3 days';
  return found;
end;
$$;

revoke all on function public.claim_order_payment(text, text, integer, text) from public;
grant execute on function public.claim_order_payment(text, text, integer, text) to anon, authenticated;
