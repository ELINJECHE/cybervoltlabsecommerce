import type { CartItem } from "@/lib/cart-context";
import { supabase, supabaseEnabled } from "@/lib/supabase";

export interface OrderPayload {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  submittedAt: string;
}

// Set NEXT_PUBLIC_ORDER_WEBHOOK_URL in .env.local to your own endpoint
// (Zapier/Make/Sheet webhook, or a serverless function) to receive orders.
// Static export has no API routes, so this posts directly from the browser —
// if you need to hide the endpoint or validate server-side, drop `output:
// "export"` from next.config.mjs and add a Route Handler instead.
const ORDER_WEBHOOK_URL = process.env.NEXT_PUBLIC_ORDER_WEBHOOK_URL;

export async function submitOrder(payload: OrderPayload): Promise<void> {
  if (!ORDER_WEBHOOK_URL) {
    throw new Error(
      "No order webhook configured. Set NEXT_PUBLIC_ORDER_WEBHOOK_URL in .env.local to receive orders."
    );
  }

  // Google Apps Script web apps don't implement CORS preflight (OPTIONS), so
  // a request with Content-Type: application/json gets blocked by the
  // browser before it's ever sent. text/plain is a CORS "simple request" —
  // no preflight — and Apps Script parses the raw body as JSON regardless
  // of the declared content type, so this works without any server change.
  const response = await fetch(ORDER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Order webhook responded with ${response.status}`);
  }
}

// Records the order against a logged-in customer's account so it shows in
// their order history and can later earn loyalty points once staff confirm
// payment (see docs/SUPABASE_SETUP.md). Best-effort: failures here must never
// block checkout — the webhook above is the order of record for fulfillment.
export async function recordAccountOrder(customerId: string, payload: OrderPayload): Promise<void> {
  if (!supabaseEnabled) return;

  const { error } = await supabase.from("orders").insert({
    customer_id: customerId,
    subtotal: payload.subtotal,
    items: payload.items,
    delivery_address: payload.deliveryAddress,
    phone: payload.phone,
    notes: payload.notes || null,
  });

  if (error) {
    console.error("Failed to record order against account:", error.message);
  }
}
