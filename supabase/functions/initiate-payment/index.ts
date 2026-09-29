// Supabase Edge Function: initiate-payment
//
// Called by the checkout page. Creates a pending transaction record, then
// triggers a PayHero M-Pesa STK push. Returns as soon as the push is sent —
// it does NOT wait for the customer to approve/decline on their phone.
// PayHero calls `payment-callback` (a separate function) once they do.
//
// Runs entirely server-side so PayHero's API credentials never reach the
// browser. See docs/PAYHERO_SETUP.md for deployment steps.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke/api/v2";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// M-Pesa STK push requires 2547XXXXXXXX format, no "+", no leading 0.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  const jsonHeaders = { ...corsHeaders(origin), "Content-Type": "application/json" };

  try {
    const { customerName, phone, deliveryAddress, notes, items, amount, customerId } = await req.json();

    if (!customerName || !phone || !deliveryAddress || !Array.isArray(items) || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const reference = crypto.randomUUID();

    const { error: insertError } = await supabaseAdmin.from("payhero_transactions").insert({
      order_reference: reference,
      customer_id: customerId ?? null,
      customer_name: customerName,
      phone,
      delivery_address: deliveryAddress,
      notes: notes ?? null,
      items,
      amount,
      status: "pending",
    });

    if (insertError) {
      throw new Error(`Failed to create transaction record: ${insertError.message}`);
    }

    const apiUsername = Deno.env.get("PAYHERO_API_USERNAME")!;
    const apiPassword = Deno.env.get("PAYHERO_API_PASSWORD")!;
    const channelId = Deno.env.get("PAYHERO_CHANNEL_ID")!;
    const authToken = "Basic " + btoa(`${apiUsername}:${apiPassword}`);
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-callback`;

    const payheroResponse = await fetch(`${PAYHERO_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        phone_number: normalizePhone(phone),
        channel_id: Number(channelId),
        external_reference: reference,
        callback_url: callbackUrl,
        provider: "m-pesa",
      }),
    });

    if (!payheroResponse.ok) {
      const errorText = await payheroResponse.text();
      await supabaseAdmin
        .from("payhero_transactions")
        .update({ status: "failed", result_desc: `PayHero request failed: ${errorText}` })
        .eq("order_reference", reference);

      return new Response(
        JSON.stringify({ error: "Failed to initiate payment", details: errorText }),
        { status: 502, headers: jsonHeaders }
      );
    }

    return new Response(JSON.stringify({ reference }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
