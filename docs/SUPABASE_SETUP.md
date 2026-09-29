# Supabase setup — customer accounts & loyalty points

This adds real customer accounts and a points ledger (5 points per KES 1,000 spent = KES 50
value, plus 100 points for newsletter signup) without adding a server — Supabase's client SDK
talks directly from the browser to a hosted Postgres database, so the site stays a static export.

I can't create the Supabase project myself (it needs your own account) — here's exactly what to
do, in order.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com), sign up/log in, create a new project.
2. Wait for it to finish provisioning (~2 minutes).
3. Go to **Project Settings → API**. You'll need two values:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon / public key** (a long JWT string — NOT the `service_role` key, that one must never
     be used in frontend code)

## 2. Run the schema

Go to **SQL Editor** in the Supabase dashboard, paste the entire block below, and run it once.

```sql
-- Customer profile, one row per signed-up user
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Orders placed by logged-in customers (guest checkout still works — those
-- orders only go to the Google Sheets webhook, not here, so they earn no points)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  subtotal numeric not null,
  items jsonb not null,
  delivery_address text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

-- No UPDATE policy is granted to the `authenticated` role, on purpose —
-- customers must never be able to set their own order to "confirmed" (that
-- would let them award themselves points for unpaid orders). Staff confirm
-- orders from the Supabase Table Editor (Authentication is bypassed there
-- via your project's service role), after checking the M-Pesa till for
-- payment. See "Confirming an order" below.

-- Force every new order to start "pending" regardless of what the client sends
create function public.force_pending_status()
returns trigger
language plpgsql
as $$
begin
  new.status := 'pending';
  new.confirmed_at := null;
  return new;
end;
$$;

create trigger force_pending_on_insert
  before insert on public.orders
  for each row execute procedure public.force_pending_status();

-- Points ledger — one row per points-earning event
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null,
  reason text not null check (reason in ('order', 'newsletter_signup')),
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.points_ledger enable row level security;

create policy "Users can view their own points"
  on public.points_ledger for select
  using (auth.uid() = customer_id);

-- No INSERT/UPDATE/DELETE policy for `authenticated` — every row is written
-- by the SECURITY DEFINER functions below, never directly by the client.

-- One newsletter signup bonus per customer, ever
create unique index points_ledger_one_newsletter_bonus
  on public.points_ledger (customer_id)
  where (reason = 'newsletter_signup');

-- One points award per confirmed order, ever (prevents double-crediting if
-- an order's status is touched more than once)
create unique index points_ledger_one_award_per_order
  on public.points_ledger (order_id)
  where (reason = 'order');

-- Award 5 points per KES 1,000 spent (rounded down) when an order flips to "confirmed"
create function public.award_order_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    insert into public.points_ledger (customer_id, points, reason, order_id)
    values (new.customer_id, floor(new.subtotal / 1000) * 5, 'order', new.id)
    on conflict (order_id) where (reason = 'order') do nothing;
  end if;
  return new;
end;
$$;

create trigger on_order_confirmed
  after update on public.orders
  for each row execute procedure public.award_order_points();

-- Callable from the client: awards the 100-point newsletter signup bonus
-- exactly once per customer. Runs as SECURITY DEFINER so it can write to
-- points_ledger even though customers have no direct INSERT grant on it.
-- Returns true if points were newly awarded, false if already claimed before.
create function public.claim_newsletter_points()
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be logged in to claim newsletter points';
  end if;

  insert into public.points_ledger (customer_id, points, reason)
  values (auth.uid(), 100, 'newsletter_signup')
  on conflict (customer_id) where (reason = 'newsletter_signup') do nothing;

  return found;
end;
$$;

-- Convenience view: current points balance per customer
create view public.points_balances as
select customer_id, coalesce(sum(points), 0) as balance
from public.points_ledger
group by customer_id;

-- Product catalog — the admin panel reads/writes these. The live site's
-- build reads from here (falling back to data/*.json if Supabase isn't
-- configured), so editing a product here has no effect until the next
-- rebuild (see "Deploy hook" below).
create table public.categories (
  slug text primary key,
  name text not null,
  image text not null default '',
  subcategories jsonb not null default '[]'::jsonb
);

alter table public.categories enable row level security;

create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create table public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text not null references public.categories (slug),
  subcategory text,
  price numeric not null,
  discount_price numeric,
  images jsonb not null default '[]'::jsonb,
  colors jsonb,
  features jsonb not null default '[]'::jsonb,
  rating numeric not null default 0,
  review_count integer not null default 0,
  stock integer not null default 0,
  is_deal boolean not null default false,
  deal_ends_at timestamptz,
  deal_claimed_percent integer,
  is_new_arrival boolean not null default false,
  verified boolean not null default false,
  description text,
  jumia_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Admins can manage products"
  on public.products for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
```

## 3. Enable email auth

**Authentication → Providers → Email** should already be on by default. Decide whether you want
email confirmation required before login (Authentication → Settings) — turning it off makes
testing faster; turn it on before going live to stop fake signups from claiming the newsletter
bonus.

## 4. Wire it into the site

Add these to `.env.local` (send me the values and I'll drop them in):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Confirming an order (awarding points)

Since there's no payment gateway, payment confirmation is manual:

1. Customer places an order while logged in → it lands in **Table Editor → orders** with
   `status = pending` (and, separately, in your Google Sheet via the existing webhook — that
   path is unchanged and still receives every order, guest or logged-in).
2. Check M-Pesa for the till payment.
3. In **Table Editor → orders**, open that row and change `status` to `confirmed`.
4. The database trigger fires automatically and credits `floor(subtotal / 1000) * 5` points to
   that customer — no other action needed.

This is a deliberately manual step for now. If order volume grows enough that this becomes
tedious, the natural next step is a small internal admin page on the site (gated to your staff)
so this doesn't require Supabase dashboard access — say the word and I'll build it.

## 6. Making yourself an admin

The admin panel (`/admin`) is only visible to accounts with `is_admin = true`. There's no
signup flow for this — you flip it manually, once, per admin account:

1. Sign up for a normal account on the live site (`/account/signup`) with the email you want to
   use for admin access.
2. In Supabase, go to **Table Editor → profiles**, find that row (matched by your user id — cross-
   check against **Authentication → Users** if you have more than one row), and set `is_admin` to
   `true`.
3. Log back in — the "Admin" link appears in the account menu once `is_admin` is true.

Repeat for any staff member who should be able to manage products.

## 7. Product image storage

Product photos uploaded through the admin panel go into Supabase Storage.

1. Go to **Storage** in the Supabase dashboard → **New bucket**.
2. Name it exactly `product-images`, and toggle it **Public** (so product photos load on the live
   site without needing a signed URL).
3. Go to the bucket's **Policies** tab and add a policy allowing `INSERT`/`UPDATE`/`DELETE` for
   admins only:

```sql
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
```

## 8. Deploy hook — making admin changes actually go live

The site is a static export: it's pre-built HTML, so saving a product in the admin panel updates
the database, but the *live* site won't show it until the next build. To make that automatic:

**On Vercel:** Project → Settings → Git → **Deploy Hooks** → create one (any name, e.g.
"admin-panel"), pointing at your production branch. Copy the URL it gives you.

**On Netlify:** Site settings → Build & deploy → **Build hooks** → Add build hook. Copy the URL.

Either way, paste it into `.env.local`:

```
NEXT_PUBLIC_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

Every time you create, edit, or delete a product/category in `/admin`, the site POSTs to this URL,
which kicks off a fresh build. It typically takes 1–2 minutes for the change to appear live — the
admin panel will tell you a rebuild was triggered, but won't wait for it to finish.

If this is left unset, admin changes still save to the database correctly, but nothing rebuilds
automatically — you'd need to manually redeploy (e.g. an empty commit, or clicking "Redeploy" on
Vercel/Netlify) to see them live.

## 9. Seeding the existing 100-product catalog into Supabase

Once the schema above is created, run this once to copy your existing `data/products.json` and
`data/categories.json` into Supabase, so the admin panel has something to show and edit instead of
starting empty:

```bash
cd cybervolt-labs
SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/seed-supabase.mjs
```

The **service role key** (Project Settings → API → `service_role` — different from the `anon` key)
is required here because it bypasses the admin-only RLS policy for this one bulk import. Never put
this key in `.env.local` or any file the app loads — it's pasted directly on the command line for
this one-time script and nowhere else.
