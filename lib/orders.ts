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
  // Extra fields are ignored by the original sheet script (the same facts are
  // also written into Notes), and used by the optional extended script in
  // docs/GOOGLE_SHEETS_WEBHOOK.md.
  orderReference?: string;
  type?: "order" | "payment-confirmation";
  mpesaCode?: string;
  paidAmount?: number;
  paidFromPhone?: string;
}

// What the success page needs after checkout navigates away (reference, next
// steps, and a receipt the customer can send to us on WhatsApp).
export interface LastOrderSummary {
  reference: string;
  total: number;
  phone: string;
  address: string;
  items: { name: string; quantity: number; color?: string }[];
  mpesaCode?: string;
}

const LAST_ORDER_KEY = "cv_last_order";

export function saveLastOrder(order: OrderPayload, mpesaCode?: string): void {
  const summary: LastOrderSummary = {
    reference: order.orderReference ?? "",
    total: order.subtotal,
    phone: order.phone,
    address: order.deliveryAddress,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, color: i.color })),
    mpesaCode,
  };
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summary));
  } catch {
    // Storage blocked — the success page just shows its general guidance.
  }
}

export function readLastOrder(): LastOrderSummary | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as LastOrderSummary) : null;
  } catch {
    return null;
  }
}

// Short, readable reference the customer quotes to us, e.g. CV-261012-K7QF.
// Ambiguous characters (0/O, 1/I) are left out so it survives being read aloud.
export function generateOrderReference(): string {
  const now = new Date();
  const date =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `CV-${date}-${code}`;
}

// The sheet's Notes column carries the reference and status, so staff can
// search the sheet for a reference and match an order row with its payment row.
export function tagOrderNotes(reference: string, status: string, notes?: string): string {
  return `[${reference}] ${status}${notes ? ` · ${notes}` : ""}`;
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

export interface PaymentConfirmationDetails {
  mpesaCode: string;
  paidFromPhone: string;
  paidAmount: number;
}

// A customer's own claim that they paid — staff must still check the M-Pesa
// code against the Till's statement before treating the order as paid.
export async function submitPaymentConfirmation(
  order: OrderPayload,
  details: PaymentConfirmationDetails
): Promise<void> {
  const claim = [
    `[${order.orderReference}] PAYMENT CLAIMED`,
    `M-Pesa code: ${details.mpesaCode}`,
    `Paid from: ${details.paidFromPhone}`,
    `Amount: KES ${details.paidAmount}`,
  ].join(" · ");

  await submitOrder({
    ...order,
    type: "payment-confirmation",
    notes: claim,
    mpesaCode: details.mpesaCode,
    paidFromPhone: details.paidFromPhone,
    paidAmount: details.paidAmount,
    submittedAt: new Date().toISOString(),
  });
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
