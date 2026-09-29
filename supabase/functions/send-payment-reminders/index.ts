// Supabase Edge Function: send-payment-reminders
//
// Invoked on a schedule (see docs/WHATSAPP_REMINDERS_SETUP.md for the
// pg_cron job that calls this). Finds orders whose M-Pesa payment never
// completed — customer didn't enter their PIN, or declined — and sends a
// WhatsApp reminder via the Meta Cloud API using a pre-approved utility
// template, so guest checkouts (identified only by phone number) still get
// followed up on, the same way an account-based cart would.
//
// Not invoked by the browser, so no CORS handling needed. Protect this
// function by NOT deploying it with --no-verify-jwt — the pg_cron job below
// authenticates with the service role key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REMINDER_DELAY_MINUTES = 30;
const WHATSAPP_API_VERSION = "v20.0";

interface TransactionRow {
  order_reference: string;
  customer_name: string;
  phone: string;
  items: { name: string; quantity: number }[];
  amount: number;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

function summarizeItems(items: TransactionRow["items"]): string {
  const summary = (items ?? []).map((i) => `${i.name} x${i.quantity}`).join(", ");
  return summary.length > 200 ? summary.slice(0, 197) + "..." : summary || "your order";
}

async function sendWhatsAppReminder(transaction: TransactionRow) {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
  const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME")!;
  const templateLang = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en";
  const mpesaTill = Deno.env.get("MPESA_TILL") ?? "";

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(transaction.phone),
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: transaction.customer_name || "there" },
                { type: "text", text: transaction.order_reference.slice(0, 8) },
                { type: "text", text: summarizeItems(transaction.items) },
                { type: "text", text: transaction.amount.toLocaleString("en-KE") },
                { type: "text", text: mpesaTill },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp API request failed: ${errorText}`);
  }
}

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cutoff = new Date(Date.now() - REMINDER_DELAY_MINUTES * 60 * 1000).toISOString();

    const { data: transactions, error } = await supabaseAdmin
      .from("payhero_transactions")
      .select("order_reference, customer_name, phone, items, amount")
      .in("status", ["pending", "failed"])
      .is("reminder_sent_at", null)
      .lt("created_at", cutoff);

    if (error) throw new Error(`Failed to query transactions: ${error.message}`);

    let sent = 0;
    let failed = 0;

    for (const transaction of transactions ?? []) {
      try {
        await sendWhatsAppReminder(transaction as TransactionRow);
        await supabaseAdmin
          .from("payhero_transactions")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("order_reference", (transaction as TransactionRow).order_reference);
        sent++;
      } catch (err) {
        console.error(`Reminder failed for ${(transaction as TransactionRow).order_reference}:`, err);
        failed++;
      }
    }

    return new Response(JSON.stringify({ checked: transactions?.length ?? 0, sent, failed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
