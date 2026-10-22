-- Loyalty v2: points worth KSh 1 each, a welcome voucher instead of 100 free points, and
-- redemption at checkout. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Run docs/SUPABASE_SETUP.md's schema and docs/sql/shop_orders.sql FIRST (this file builds on
-- public.profiles and public.shop_orders). Safe to run twice.
--
-- The rules (change the numbers here, and in lib/loyalty.ts so the screens say the same):
--   * 1 point = KSh 1.
--   * A paid order earns 1% of its items total, or 1.5% when the items total is KSh 20,000+
--     (discounts are not rewarded). Delivery never earns points.
--   * Points can be used at checkout: at least 100 points, and at most the smaller of 10% of the
--     items total or KSh 1,000 per order.
--   * Every account gets ONE welcome voucher: KSh 200 off a first order whose items total is
--     KSh 4,000 or more. It replaces the old 100 free points.
--   * Everything is checked here in the database, not in the browser.

-- ---------------------------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------------------------
create table if not exists public.loyalty_ledger (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.profiles (id) on delete cascade,
  points         integer not null check (points <> 0),
  reason         text not null check (reason in ('earned', 'redeemed', 'refund', 'reversal', 'adjustment')),
  shop_order_id  uuid references public.shop_orders (id) on delete set null deferrable initially deferred,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists loyalty_ledger_customer_idx on public.loyalty_ledger (customer_id);
-- One entry of each kind per order, ever (a second trigger fire can't double-credit)
create unique index if not exists loyalty_one_earned_per_order   on public.loyalty_ledger (shop_order_id) where reason = 'earned';
create unique index if not exists loyalty_one_redeemed_per_order on public.loyalty_ledger (shop_order_id) where reason = 'redeemed';
create unique index if not exists loyalty_one_refund_per_order   on public.loyalty_ledger (shop_order_id) where reason = 'refund';
create unique index if not exists loyalty_one_reversal_per_order on public.loyalty_ledger (shop_order_id) where reason = 'reversal';

alter table public.loyalty_ledger enable row level security;

drop policy if exists "Customers see their own points" on public.loyalty_ledger;
create policy "Customers see their own points"
  on public.loyalty_ledger for select
  using (auth.uid() = customer_id);

drop policy if exists "Admins manage points" on public.loyalty_ledger;
create policy "Admins manage points"
  on public.loyalty_ledger for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create table if not exists public.welcome_vouchers (
  customer_id    uuid primary key references public.profiles (id) on delete cascade,
  amount         integer not null default 200,
  min_order      integer not null default 4000,
  used_on_order  uuid,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.welcome_vouchers enable row level security;

drop policy if exists "Customers see their own voucher" on public.welcome_vouchers;
create policy "Customers see their own voucher"
  on public.welcome_vouchers for select
  using (auth.uid() = customer_id);

drop policy if exists "Admins manage vouchers" on public.welcome_vouchers;
create policy "Admins manage vouchers"
  on public.welcome_vouchers for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- What each shop order used
alter table public.shop_orders add column if not exists points_redeemed integer not null default 0;
alter table public.shop_orders add column if not exists voucher_amount  integer not null default 0;

-- Customers can read their own orders (the account page's order history). Staff already can read all.
drop policy if exists "Customers see their own orders" on public.shop_orders;
create policy "Customers see their own orders"
  on public.shop_orders for select
  using (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------------------------
-- 2. Balance view (same name and shape as before, now read from the new ledger)
-- ---------------------------------------------------------------------------------------------
create or replace view public.points_balances as
select customer_id, coalesce(sum(points), 0) as balance
from public.loyalty_ledger
group by customer_id;

-- ---------------------------------------------------------------------------------------------
-- 3. Points earned by an order
-- ---------------------------------------------------------------------------------------------
create or replace function public.loyalty_earn(p_items integer, p_discounts integer)
returns integer
language sql
immutable
as $$
  select greatest(
    floor((p_items - p_discounts) * case when p_items >= 20000 then 0.015 else 0.01 end),
    0
  )::integer;
$$;

-- ---------------------------------------------------------------------------------------------
-- 4. Welcome voucher: a customer asks for theirs once; asking again just returns it
-- ---------------------------------------------------------------------------------------------
create or replace function public.ensure_welcome_voucher()
returns table (amount integer, min_order integer, used boolean)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Log in to get your welcome voucher';
  end if;

  insert into public.welcome_vouchers (customer_id) values (auth.uid())
  on conflict (customer_id) do nothing;

  return query
    select v.amount, v.min_order, (v.used_on_order is not null)
    from public.welcome_vouchers v
    where v.customer_id = auth.uid();
end;
$$;

revoke all on function public.ensure_welcome_voucher() from public;
grant execute on function public.ensure_welcome_voucher() to authenticated;

-- The old "100 free points for the newsletter" button now awards nothing.
create or replace function public.claim_newsletter_points()
returns boolean
language sql
as $$ select false; $$;

-- ---------------------------------------------------------------------------------------------
-- 5. What would a customer get? (read-only: the checkout asks before it places the order, and
--    the order trigger below uses the very same answer)
-- ---------------------------------------------------------------------------------------------
create or replace function public.loyalty_quote(p_subtotal integer, p_points integer, p_use_voucher boolean)
returns table (voucher_off integer, points_off integer)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_cust  uuid := auth.uid();
  v_v     integer := 0;
  v_p     integer := 0;
  v_bal   integer;
  v_cap   integer;
  v_row   public.welcome_vouchers%rowtype;
begin
  if v_cust is not null then
    if p_use_voucher then
      select * into v_row from public.welcome_vouchers where customer_id = v_cust;
      if found and v_row.used_on_order is null and p_subtotal >= v_row.min_order then
        v_v := v_row.amount;
      end if;
    end if;
    if coalesce(p_points, 0) > 0 then
      select coalesce(sum(l.points), 0) into v_bal from public.loyalty_ledger l where l.customer_id = v_cust;
      v_cap := least(floor((p_subtotal - v_v) * 0.10), 1000)::integer;
      v_p := least(p_points, v_bal, v_cap);
      if v_p < 100 then v_p := 0; end if;   -- at least 100 points to redeem
    end if;
  end if;
  voucher_off := v_v;
  points_off := v_p;
  return next;
end;
$$;

revoke all on function public.loyalty_quote(integer, integer, boolean) from public;
grant execute on function public.loyalty_quote(integer, integer, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 5b. Placing an order: apply the voucher and points for real, and fix the total
--     (replaces shop_orders_before_insert from docs/sql/shop_orders.sql; same rules plus loyalty)
-- ---------------------------------------------------------------------------------------------
create or replace function public.shop_orders_before_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_cust     uuid := auth.uid();
  v_ask_pts  integer := greatest(coalesce(new.points_redeemed, 0), 0);
  v_ask_vch  integer := greatest(coalesce(new.voucher_amount, 0), 0);
  v_vch      integer := 0;
  v_pts      integer := 0;
begin
  -- Whatever the browser sends, a new order starts unpaid and belongs to the signed-in customer.
  new.status := 'awaiting_payment';
  new.mpesa_code := null;
  new.paid_amount := null;
  new.paid_from_phone := null;
  new.customer_id := v_cust;
  new.created_at := now();
  new.updated_at := now();
  new.points_redeemed := 0;
  new.voucher_amount := 0;

  if v_cust is not null and (v_ask_vch > 0 or v_ask_pts > 0) then
    perform pg_advisory_xact_lock(hashtext(v_cust::text));  -- one order at a time per customer

    select q.voucher_off into v_vch from public.loyalty_quote(new.subtotal, 0, v_ask_vch > 0) q;
    if v_vch > 0 then
      update public.welcome_vouchers
         set used_on_order = new.id, used_at = now()
       where customer_id = v_cust and used_on_order is null;
      if not found then v_vch := 0; end if;
    end if;
    new.voucher_amount := v_vch;

    select q.points_off into v_pts from public.loyalty_quote(new.subtotal - v_vch, v_ask_pts, false) q;
    if v_pts > 0 then
      new.points_redeemed := v_pts;
      insert into public.loyalty_ledger (customer_id, points, reason, shop_order_id, note)
      values (v_cust, -v_pts, 'redeemed', new.id, 'Used at checkout');
    end if;
  end if;

  -- The amount to pay is worked out here, so a browser can't understate it.
  new.total := greatest(new.subtotal + new.delivery_fee - new.voucher_amount - new.points_redeemed, 0);
  return new;
end;
$$;

drop trigger if exists shop_orders_before_insert on public.shop_orders;
create trigger shop_orders_before_insert
  before insert on public.shop_orders
  for each row execute procedure public.shop_orders_before_insert();

-- ---------------------------------------------------------------------------------------------
-- 6. Staff change an order's status: pay out points, or undo everything on a cancellation
-- ---------------------------------------------------------------------------------------------
create or replace function public.shop_orders_loyalty_after_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_earn integer;
begin
  if new.customer_id is null then
    return new;
  end if;

  -- First time the order counts as paid: earn points.
  if new.status in ('paid', 'dispatched', 'delivered')
     and old.status in ('awaiting_payment', 'payment_claimed') then
    v_earn := public.loyalty_earn(new.subtotal, new.voucher_amount + new.points_redeemed);
    if v_earn > 0 then
      insert into public.loyalty_ledger (customer_id, points, reason, shop_order_id, note)
      values (new.customer_id, v_earn, 'earned', new.id, 'Order ' || new.reference)
      on conflict (shop_order_id) where (reason = 'earned') do nothing;
    end if;
  end if;

  -- Cancelled: give back points that were used, free the voucher, and take back points it earned.
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    if new.points_redeemed > 0 then
      insert into public.loyalty_ledger (customer_id, points, reason, shop_order_id, note)
      values (new.customer_id, new.points_redeemed, 'refund', new.id, 'Order ' || new.reference || ' cancelled')
      on conflict (shop_order_id) where (reason = 'refund') do nothing;
    end if;
    update public.welcome_vouchers
       set used_on_order = null, used_at = null
     where customer_id = new.customer_id and used_on_order = new.id;
    insert into public.loyalty_ledger (customer_id, points, reason, shop_order_id, note)
    select l.customer_id, -l.points, 'reversal', new.id, 'Order ' || new.reference || ' cancelled'
      from public.loyalty_ledger l
     where l.shop_order_id = new.id and l.reason = 'earned'
    on conflict (shop_order_id) where (reason = 'reversal') do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists shop_orders_loyalty_after_update on public.shop_orders;
create trigger shop_orders_loyalty_after_update
  after update on public.shop_orders
  for each row execute procedure public.shop_orders_loyalty_after_update();
