# PayHero M-Pesa STK Push integration

This adds automatic M-Pesa payment at checkout: the customer enters their phone, gets an STK
push prompt instantly, and once they approve it, PayHero calls back to confirm — no manual
Till-number confirmation needed. If the customer is logged in, their loyalty points get credited
automatically the moment payment succeeds.

## Why this needs Supabase Edge Functions

PayHero's API credentials (username/password) must never reach the browser — anyone could read
them from dev tools and make payment requests as your business. Since the site has no server of
its own (static export), the API calls have to happen from a small piece of server-side code
instead: two Supabase Edge Functions, running entirely outside the Next.js app, holding the
credentials as secrets the browser never sees.

- **`initiate-payment`** — the checkout page calls this. It creates a transaction record, calls
  PayHero to trigger the STK push, and returns immediately (it does not wait for the customer to
  approve the prompt).
- **`payment-callback`** — PayHero calls this on its own, after the customer approves or declines
  the prompt on their phone. It updates the transaction record and, for logged-in customers,
  credits loyalty points automatically.

The checkout page polls the transaction record every few seconds to show "Payment received!" or
"Payment failed" once the callback lands.

## 1. Run the database schema

**SQL Editor → New query**, paste and run:

```sql
create table public.payhero_transactions (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  customer_id uuid references public.profiles (id),
  customer_name text not null,
  phone text not null,
  delivery_address text not null,
  notes text,
  items jsonb not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  checkout_request_id text,
  mpesa_receipt_number text,
  result_desc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payhero_transactions enable row level security;

-- The checkout page polls this by order_reference to show payment status —
-- readable by anyone, but only Edge Functions (via the service role, which
-- bypasses RLS) ever write to it, so there's no public insert/update policy.
create policy "Anyone can view a transaction"
  on public.payhero_transactions for select
  using (true);
```

## 2. Install the Supabase CLI and log in

```bash
npx supabase login
```

This opens a browser to authorize the CLI against your Supabase account.

## 3. Link this project to your Supabase project

From the `cybervolt-labs` folder:

```bash
npx supabase link --project-ref ptyxbmydwhqkrewmgzed
```

## 4. Set the secrets (never committed, never in `.env.local`)

```bash
npx supabase secrets set \
  PAYHERO_API_USERNAME=your-api-username \
  PAYHERO_API_PASSWORD=your-api-password \
  PAYHERO_CHANNEL_ID=11777
```

Use the exact Username/Password from PayHero's **API Keys** page and the Channel ID from
**Payment Channels**. These live only in Supabase's secret store — they are never written to any
file in this repository.

## 5. Deploy the two functions

```bash
npx supabase functions deploy initiate-payment --no-verify-jwt
npx supabase functions deploy payment-callback --no-verify-jwt
```

`--no-verify-jwt` is required for `payment-callback` specifically, since PayHero calls it directly
with no Supabase auth token — it's still safe, because the function only trusts data matched
against a transaction reference your own `initiate-payment` call created moments earlier.

## 6. Note the function URLs

After deploying, your functions are reachable at:

```
https://ptyxbmydwhqkrewmgzed.supabase.co/functions/v1/initiate-payment
https://ptyxbmydwhqkrewmgzed.supabase.co/functions/v1/payment-callback
```

The site already points to these (see `lib/payhero.ts`) — no further configuration needed on the
Next.js side once deployed.

## 7. Test it

Place a real order at checkout with your own phone number. You should get an STK push prompt
within a few seconds. Approve it, and the checkout page should show a success state shortly after
(polling checks every 3 seconds). Check **Table Editor → payhero_transactions** to see the full
record, including the M-Pesa receipt number once it lands.
