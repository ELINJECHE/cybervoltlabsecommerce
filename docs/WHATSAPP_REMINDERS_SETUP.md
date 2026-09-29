# WhatsApp Payment Reminders

Automatically follows up — by WhatsApp — with any customer whose M-Pesa
payment never completed (they didn't enter their PIN in time, or declined),
30 minutes after checkout. Works for guest checkouts too, since it's keyed
on the phone number stored on the transaction, not a customer account.

This mirrors what larger retailers (e.g. Jumia, or the HEFA reminder you
received) already do — the message is sent by your own WhatsApp Business
number, referencing the specific order and amount.

## How it works

1. Checkout already creates a `payhero_transactions` row the moment a
   customer submits the form (see `supabase/functions/initiate-payment`),
   before M-Pesa confirms anything.
2. A new Edge Function, `send-payment-reminders`, is invoked on a schedule.
   It finds transactions still `pending` or `failed` after 30 minutes with
   no reminder sent yet, and sends each one a WhatsApp message via the Meta
   Cloud API.
3. `reminder_sent_at` is stamped so nobody gets reminded twice.

## 1. Add the tracking column

Run this once in the Supabase SQL Editor (Dashboard → SQL Editor):

```sql
alter table payhero_transactions
  add column if not exists reminder_sent_at timestamptz;
```

## 2. Set up the Meta WhatsApp Cloud API

You'll need a Meta Business Account with the WhatsApp product enabled
(business.facebook.com → WhatsApp → API Setup):

1. **Phone Number ID** — shown on the API Setup page for your WhatsApp
   business number.
2. **Permanent access token** — API Setup gives a temporary 24-hour token
   first; for production, generate a permanent one under
   System Users (Business Settings → Users → System Users → generate token
   with `whatsapp_business_messaging` permission).
3. **Message template** — create one under WhatsApp → Message Templates,
   category **Utility** (this is a transactional order-status message, not
   marketing, so it qualifies for the simpler Utility approval path — no
   customer opt-in tracking required). Example body, with 5 variables:

   ```
   Hi {{1}}, your Cybervolt Labs order #{{2}} ({{3}}) worth KSh {{4}} is
   still pending payment. Pay via M-Pesa Till {{5}} to complete it, or
   reply here if you need help.
   ```

   Submit it for approval — Meta typically reviews Utility templates within
   minutes to a few hours. Note the exact template name and language code
   once approved.

## 3. Set the secrets

```bash
npx supabase secrets set \
  WHATSAPP_ACCESS_TOKEN=your_permanent_token \
  WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id \
  WHATSAPP_TEMPLATE_NAME=your_approved_template_name \
  WHATSAPP_TEMPLATE_LANG=en \
  MPESA_TILL=7737288
```

## 4. Deploy the function

```bash
npx supabase functions deploy send-payment-reminders
```

(No `--no-verify-jwt` this time — the cron job below authenticates with the
service role key, so the function should keep its default JWT check.)

## 5. Schedule it

Run once in the Supabase SQL Editor to enable the required extensions and
schedule the job every 30 minutes:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-payment-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-payment-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR-PROJECT-REF` with your Supabase project ref and
`YOUR_SERVICE_ROLE_KEY` with the service role key from
Project Settings → API. Run this directly in the SQL Editor — don't commit
the service role key to any file in the repo.

To check it's running: `select * from cron.job;` and
`select * from cron.job_run_details order by start_time desc limit 5;`

## Notes

- Reminders only go out once per transaction — a customer who pays after
  receiving one won't get a second message (status will have moved to
  `success`).
- If you ever want a second, later reminder (e.g. at 24h), duplicate the
  `send-payment-reminders` job with a longer `REMINDER_DELAY_MINUTES` and a
  separate "already reminded once" condition — not built yet since one
  follow-up matches what HEFA does.
