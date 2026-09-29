import { supabase, supabaseEnabled } from "@/lib/supabase";
import type { CartItem } from "@/lib/cart-context";

export interface PayHeroCheckoutInput {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  notes?: string;
  items: CartItem[];
  amount: number;
  customerId?: string;
}

export type PayHeroTransactionStatus = "pending" | "success" | "failed";

// Fires the STK push and returns immediately — this does not wait for the
// customer to approve it on their phone. Call pollPayHeroStatus() with the
// returned reference to find out what happened.
export async function initiatePayHeroPayment(input: PayHeroCheckoutInput): Promise<string> {
  if (!supabaseEnabled) {
    throw new Error("M-Pesa payment isn't set up yet.");
  }

  const { data, error } = await supabase.functions.invoke("initiate-payment", {
    body: input,
  });

  if (error) throw new Error(error.message);
  if (!data?.reference) throw new Error("PayHero did not return a transaction reference.");
  return data.reference as string;
}

export async function getPayHeroStatus(reference: string): Promise<PayHeroTransactionStatus> {
  const { data, error } = await supabase
    .from("payhero_transactions")
    .select("status")
    .eq("order_reference", reference)
    .single();

  if (error || !data) return "pending";
  return data.status as PayHeroTransactionStatus;
}

// Polls until the customer approves/declines the STK prompt (or PayHero's
// callback lands), or the timeout elapses — whichever comes first.
export async function pollPayHeroStatus(
  reference: string,
  { intervalMs = 3000, timeoutMs = 90000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<PayHeroTransactionStatus> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const status = await getPayHeroStatus(reference);
    if (status !== "pending") return status;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return "pending"; // timed out — still pending as far as we know
}
