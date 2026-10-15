"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatKES } from "@/lib/format";
import {
  submitOrder,
  generateOrderReference,
  tagOrderNotes,
  saveLastOrder,
  type OrderPayload,
} from "@/lib/orders";
import { initiatePayHeroPayment, pollPayHeroStatus } from "@/lib/payhero";
import { supabaseEnabled } from "@/lib/supabase";
import { getAllReviews } from "@/lib/reviews";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ManualPaymentConfirm from "@/components/ManualPaymentConfirm";
import CheckoutSteps from "@/components/CheckoutSteps";
import { SAME_DAY_HEADLINE } from "@/lib/store-info";

type Phase = "form" | "waiting-for-approval" | "manual-payment";

// The automatic M-Pesa prompt runs through Supabase Edge Functions that have to
// be deployed first (docs/PAYHERO_SETUP.md). Until NEXT_PUBLIC_MPESA_PROMPT_ENABLED
// is set to "true", checkout skips the prompt and goes straight to paying the Till
// and confirming — no failed request, no misleading "instant payment" promise.
const MPESA_PROMPT_ENABLED = supabaseEnabled && process.env.NEXT_PUBLIC_MPESA_PROMPT_ENABLED === "true";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const estimatedPoints = Math.floor(subtotal / 1000) * 5;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  // Snapshot of what was ordered — the cart is cleared once payment is confirmed,
  // but the manual-payment step still needs the details.
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [manualReason, setManualReason] = useState<string | null>(null);

  function finishCheckout(completed: OrderPayload, mpesaCode?: string) {
    saveLastOrder(completed, mpesaCode);
    clearCart();
    router.push("/checkout/success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const orderReference = generateOrderReference();
    const payload: OrderPayload = {
      type: "order",
      orderReference,
      customerName: name,
      phone,
      deliveryAddress: address,
      notes: tagOrderNotes(orderReference, "AWAITING PAYMENT", notes.trim() || undefined),
      items,
      subtotal,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Order-of-record webhook — happens regardless of how payment goes,
      // so every order attempt is visible to staff even if M-Pesa fails.
      await submitOrder(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your order. Please try again or reach us on WhatsApp."
      );
      setSubmitting(false);
      return;
    }

    setOrder(payload);

    if (!MPESA_PROMPT_ENABLED) {
      // No M-Pesa prompt available — customer pays the Till and confirms next.
      setManualReason(null);
      setPhase("manual-payment");
      setSubmitting(false);
      return;
    }

    try {
      const reference = await initiatePayHeroPayment({
        customerName: name,
        phone,
        deliveryAddress: address,
        notes,
        items,
        amount: subtotal,
        customerId: user?.id,
      });

      setPhase("waiting-for-approval");
      const status = await pollPayHeroStatus(reference);

      if (status === "success") {
        finishCheckout(payload);
        return;
      }

      setManualReason(
        status === "failed"
          ? "The M-Pesa payment wasn't completed. You can pay by Till below and confirm it."
          : "We didn't hear back from M-Pesa in time. If you approved the prompt, tell us below — otherwise pay by Till and confirm it."
      );
      setPhase("manual-payment");
    } catch (err) {
      console.error("M-Pesa prompt could not be started:", err);
      setManualReason(
        "We couldn't send the M-Pesa prompt to your phone automatically, but your order is saved. Pay by Till below, then confirm."
      );
      setPhase("manual-payment");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "manual-payment" && order) {
    return (
      <ManualPaymentConfirm
        order={order}
        reason={manualReason}
        onConfirmed={(mpesaCode) => finishCheckout(order, mpesaCode)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Add a product before checking out.</p>
      </div>
    );
  }

  if (phase === "waiting-for-approval") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="text-4xl" aria-hidden="true">📲</span>
        <h1 className="mt-4 text-xl font-bold">Check your phone</h1>
        <p className="mt-2 text-sm text-muted">
          We&rsquo;ve sent an M-Pesa payment request to {phone}. Enter your M-Pesa PIN to approve
          it — this page will update automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Checkout</h1>
      <p className="mb-4 text-sm font-medium text-primary">🚚 {SAME_DAY_HEADLINE} — order today, get it today</p>
      <CheckoutSteps current={1} />

      <div className="mb-6 rounded-card border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold">Order Summary</h2>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {items.map((item) => (
            <li key={`${item.productId}-${item.color ?? ""}`} className="flex justify-between">
              <span className="line-clamp-1">
                {item.name} × {item.quantity}
              </span>
              <span>{formatKES(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold">
          <span>Total</span>
          <span>{formatKES(subtotal)}</span>
        </div>
      </div>

      {MPESA_PROMPT_ENABLED ? (
        <div className="mb-6 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
          <h2 className="mb-1 font-semibold text-success">Pay with M-Pesa</h2>
          <p className="text-muted">
            Placing your order sends an M-Pesa prompt straight to your phone — enter your PIN to
            pay instantly. No manual steps needed.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
          <h2 className="mb-1 font-semibold text-success">How paying works</h2>
          <p className="text-muted">
            Fill in your details and place your order. Next you&rsquo;ll see our M-Pesa Till number
            and the exact amount to pay, then you confirm with the code from your M-Pesa SMS.
            Your order isn&rsquo;t complete until you&rsquo;ve paid and confirmed.
          </p>
        </div>
      )}

      {user ? (
        estimatedPoints > 0 && (
          <div className="mb-6 rounded-card border border-secondary/30 bg-secondary-light p-4 text-sm">
            <p className="text-secondary">
              You&rsquo;ll earn <strong>{estimatedPoints} points</strong> on this order once
              payment is confirmed.
            </p>
          </div>
        )
      ) : (
        <div className="mb-6 rounded-card border border-border bg-surface p-4 text-sm text-muted">
          <Link href="/account/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/account/signup" className="font-medium text-primary hover:underline">
            create an account
          </Link>{" "}
          to earn loyalty points on this order.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            {MPESA_PROMPT_ENABLED ? "M-Pesa Phone Number" : "Phone Number"}
          </label>
          <input
            id="phone"
            type="tel"
            required
            placeholder="07XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium">Delivery Address</label>
          <textarea
            id="address"
            required
            rows={3}
            placeholder="Estate/building, area, town"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium">Order Notes (optional)</label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && (
          <p className="rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {submitting
            ? "Placing Order..."
            : MPESA_PROMPT_ENABLED
              ? "Place Order & Pay with M-Pesa"
              : "Place Order & Continue to Payment"}
        </button>
      </form>
    </div>

    <ReviewsCarousel reviews={getAllReviews()} />
    </div>
  );
}
