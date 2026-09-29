// Supabase Edge Function: payment-callback
//
// PayHero calls this directly (no Supabase auth) after a customer
// approves/declines an STK push prompt on their phone. Matches the payload
// back to a transaction via `external_reference` (which we generated and
// sent in the original request), updates its status, and — for logged-in
// customers whose payment succeeded — records a confirmed order so the
// existing loyalty-points database trigger fires automatically.
//
// Deployed with --no-verify-jwt (see docs/PAYHERO_SETUP.md) since PayHero
// has no Supabase session; trust instead comes from only ever acting on a
// reference this project itself created moments earlier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PayHeroCallbackBody {
  status: boolean;
  response?: {
    Amount?: number;
    CheckoutRequestID?: string;
    ExternalReference?: string;
    MpesaReceiptNumber?: string;
    Phone?: string;
    ResultDesc?: string;
    Status?: string;
  };
}

Deno.serve(async (req) => {
  try {
    const body: PayHeroCallbackBody = await req.json();
    const result = body?.response;
    const reference = result?.ExternalReference;
    const success = body?.status === true && result?.Status === "Success";

    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing ExternalReference" }), { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from("payhero_transactions")
      .select("*")
      .eq("order_reference", reference)
      .single();

    if (fetchError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), { status: 404 });
    }

    await supabaseAdmin
      .from("payhero_transactions")
      .update({
        status: success ? "success" : "failed",
        checkout_request_id: result?.CheckoutRequestID ?? null,
        mpesa_receipt_number: result?.MpesaReceiptNumber ?? null,
        result_desc: result?.ResultDesc ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("order_reference", reference);

    // Logged-in customer + successful payment: record a confirmed order so
    // the points trigger fires. Insert always lands as "pending" (a
    // database trigger forces that), so confirming is a separate update —
    // that second write is what actually credits points.
    if (success && transaction.customer_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          customer_id: transaction.customer_id,
          subtotal: transaction.amount,
          items: transaction.items,
          delivery_address: transaction.delivery_address,
          phone: transaction.phone,
          notes: transaction.notes,
        })
        .select()
        .single();

      if (!orderError && order) {
        await supabaseAdmin.from("orders").update({ status: "confirmed" }).eq("id", order.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
