"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatKES } from "@/lib/format";
import {
  submitOrder,
  recordShopOrder,
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
import { MVP_CODE, MVP_DELIVERY_DISCOUNT } from "@/lib/community";
import { useDeliveryArea } from "@/lib/use-delivery-area";
import { LOYALTY_V2, TIER_THRESHOLD, maxRedeemable, pointsEarned } from "@/lib/loyalty";
import { supabase } from "@/lib/supabase";
import { trackShop } from "@/lib/analytics";
import { readSource } from "@/lib/source";
import ErrorNotice from "@/components/ErrorNotice";
import { ERROR_CODES, toAppError, type AppError } from "@/lib/errors";
import {
  NAIROBI_ZONES,
  OUTSIDE_NAIROBI_NOTE,
  OUTSIDE_NAIROBI_SLUG,
  describeDelivery,
  freeDeliveryApplies,
  FREE_DELIVERY_FROM,
  feeLabel,
  resolveDelivery,
} from "@/lib/delivery";

type Phase = "form" | "waiting-for-approval" | "manual-payment";

// The automatic M-Pesa prompt runs through Supabase Edge Functions that have to
// be deployed first (docs/PAYHERO_SETUP.md). Until NEXT_PUBLIC_MPESA_PROMPT_ENABLED
// is set to "true", checkout skips the prompt and goes straight to paying the Till
// and confirming — no failed request, no misleading "instant payment" promise.
const MPESA_PROMPT_ENABLED = supabaseEnabled && process.env.NEXT_PUBLIC_MPESA_PROMPT_ENABLED === "true";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, pointsBalance, welcomeVoucher, refreshPoints, refreshVoucher } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [building, setBuilding] = useState("");
  const { slug: storedArea, setArea: rememberArea } = useDeliveryArea();
  // Start from the area chosen in the top bar.
  useEffect(() => {
    if (storedArea && !areaSlug) setAreaSlug(storedArea);
  }, [storedArea, areaSlug]);
  const [mvpCode, setMvpCode] = useState("");
  const delivery = resolveDelivery(areaSlug, building);
  // Goods + delivery fee (the fee is 0 outside Nairobi: that one is paid to the courier).
  // The MVP code takes KSh 100 off the delivery fee (never below zero; not for courier parcels).
  const mvpApplied = mvpCode.trim().toUpperCase() === MVP_CODE;
  const freeDelivery = freeDeliveryApplies(subtotal, delivery);
  const deliveryFee = freeDelivery ? 0 : (delivery?.fee ?? 0);
  const mvpDiscount = mvpApplied && delivery && !delivery.payOnDelivery ? Math.min(MVP_DELIVERY_DISCOUNT, deliveryFee) : 0;
  // Rewards: the welcome voucher (a first order of KSh 4,000+) and points (1 point = KSh 1).
  const [useVoucher, setUseVoucher] = useState(true);
  const [usePoints, setUsePoints] = useState(false);
  const voucherEligible = LOYALTY_V2 && !!user && !!welcomeVoucher && !welcomeVoucher.used && subtotal >= welcomeVoucher.minOrder;
  const voucherOff = voucherEligible && useVoucher ? welcomeVoucher!.amount : 0;
  const redeemMax = LOYALTY_V2 && user ? maxRedeemable(subtotal, voucherOff, pointsBalance) : 0;
  const pointsOff = usePoints ? redeemMax : 0;
  const estimatedPoints = LOYALTY_V2 ? pointsEarned(subtotal, voucherOff + pointsOff) : 0;
  const total = subtotal + deliveryFee - mvpDiscount - voucherOff - pointsOff;
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  // Once per visit to this page, as soon as the saved cart has loaded.
  const startedCheckout = useRef(false);
  useEffect(() => {
    if (startedCheckout.current || items.length === 0) return;
    startedCheckout.current = true;
    trackShop("begin_checkout", items.map((i) => ({ id: i.productId, name: i.name, price: i.unitPrice, quantity: i.quantity })));
  }, [items]);
  // Snapshot of what was ordered — the cart is cleared once payment is confirmed,
  // but the manual-payment step still needs the details.
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [manualReason, setManualReason] = useState<string | null>(null);

  function finishCheckout(completed: OrderPayload, mpesaCode?: string) {
    trackShop(
      "purchase",
      completed.items.map((i) => ({ id: i.productId, name: i.name, price: i.unitPrice, quantity: i.quantity })),
      { transactionId: completed.orderReference, shipping: completed.deliveryFee ?? 0 },
    );
    saveLastOrder(completed, mpesaCode);
    clearCart();
    router.push("/checkout/success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!delivery) {
      setError({ message: "Please choose your delivery area so we can add the delivery fee." });
      return;
    }
    if (delivery.needsBuilding) {
      setError({ message: "Please type your building or estate so we can confirm the exact delivery fee." });
      return;
    }
    setSubmitting(true);
    setError(null);

    const orderReference = generateOrderReference();
    const payload: OrderPayload = {
      type: "order",
      orderReference,
      customerName: name,
      phone,
      deliveryAddress: `${delivery.name}${delivery.building ? ` (${delivery.building})` : ""}: ${address}`,
      notes: tagOrderNotes(
        orderReference,
        "AWAITING PAYMENT",
        [describeDelivery(delivery), freeDelivery ? `FREE delivery (items over KSh ${FREE_DELIVERY_FROM})` : "", `Source: ${readSource()}`, mvpDiscount > 0 ? `MVP code ${MVP_CODE} (-KSh ${mvpDiscount} delivery)` : "", voucherOff > 0 ? `Welcome voucher (-KSh ${voucherOff})` : "", pointsOff > 0 ? `Points used (-KSh ${pointsOff})` : "", `Total to pay now KSh ${total}`, notes.trim()].filter(Boolean).join(" · ")
      ),
      items,
      subtotal,
      deliveryArea: delivery.building ? `${delivery.name} (${delivery.building})` : delivery.name,
      deliveryFee: deliveryFee - mvpDiscount,
      deliveryPayOnArrival: delivery.payOnDelivery,
      total,
      voucherAmount: voucherOff,
      pointsRedeemed: pointsOff,
      submittedAt: new Date().toISOString(),
    };

    // Using rewards: ask the database what it will really allow, then book the order with it first,
    // so a voucher or points are never promised to the customer without being used up.
    let recorded = false;
    if (voucherOff > 0 || pointsOff > 0) {
      const { data, error: quoteError } = await supabase.rpc("loyalty_quote", {
        p_subtotal: subtotal,
        p_points: pointsOff,
        p_use_voucher: voucherOff > 0,
      });
      const q = Array.isArray(data) ? data[0] : data;
      if (quoteError || !q || q.voucher_off !== voucherOff || q.points_off !== pointsOff) {
        if (quoteError) console.error("[CV-LOY-01] quote:", quoteError.message);
        setError(toAppError(new Error("rewards changed"), "CV-LOY-01"));
        await Promise.all([refreshPoints(), refreshVoucher()]);
        setSubmitting(false);
        return;
      }
      recorded = await recordShopOrder(payload);
      if (!recorded) {
        setError(toAppError(new Error("rewards not recorded"), "CV-LOY-01"));
        setSubmitting(false);
        return;
      }
    }

    try {
      // Order-of-record webhook — happens regardless of how payment goes,
      // so every order attempt is visible to staff even if M-Pesa fails.
      await submitOrder(payload);
    } catch (err) {
      setError(toAppError(err, "CV-ORDER-02"));
      setSubmitting(false);
      return;
    }

    if (!recorded) await recordShopOrder(payload);
    if (voucherOff > 0 || pointsOff > 0) await Promise.all([refreshPoints(), refreshVoucher()]);
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
        deliveryAddress: `${delivery.name}${delivery.building ? ` (${delivery.building})` : ""}: ${address}`,
        notes,
        items,
        amount: total,
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
        `${ERROR_CODES["CV-PAY-01"].customer} (Reference CV-PAY-01)`
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
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
          <span>Items</span>
          <span>{formatKES(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span>Delivery{delivery && !delivery.payOnDelivery ? ` (${delivery.name})` : ""}</span>
          <span className={delivery ? "" : "text-muted"}>
            {!delivery
              ? "Choose your area below"
              : delivery.payOnDelivery
                ? "Pay courier on arrival"
                : freeDelivery ? "FREE" : formatKES(delivery.fee)}
          </span>
        </div>
        {mvpDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-success">
            <span>MVP code</span>
            <span>−{formatKES(mvpDiscount)}</span>
          </div>
        )}
        {voucherOff > 0 && (
          <div className="mt-1 flex justify-between text-sm text-success">
            <span>Welcome voucher</span>
            <span>−{formatKES(voucherOff)}</span>
          </div>
        )}
        {pointsOff > 0 && (
          <div className="mt-1 flex justify-between text-sm text-success">
            <span>Points used</span>
            <span>−{formatKES(pointsOff)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
          <span>{delivery ? "Total to pay now" : "Total"}</span>
          <span>{formatKES(total)}</span>
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

      {LOYALTY_V2 && (
        user ? (
          <div className="mb-6 rounded-card border border-secondary/30 bg-secondary-light p-4 text-sm">
            {welcomeVoucher && !welcomeVoucher.used && (
              voucherEligible ? (
                <label className="mb-2 flex items-start gap-2 text-secondary">
                  <input type="checkbox" checked={useVoucher} onChange={(e) => setUseVoucher(e.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>Use my <strong>{formatKES(welcomeVoucher.amount)}</strong> welcome voucher on this order</span>
                </label>
              ) : (
                <p className="mb-2 text-secondary">
                  Your {formatKES(welcomeVoucher.amount)} welcome voucher needs items worth {formatKES(welcomeVoucher.minOrder)} or more
                  (you&rsquo;re {formatKES(welcomeVoucher.minOrder - subtotal)} away).
                </p>
              )
            )}
            {redeemMax > 0 && (
              <label className="mb-2 flex items-start gap-2 text-secondary">
                <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="mt-0.5 h-4 w-4" />
                <span>Use <strong>{redeemMax} points</strong> (−{formatKES(redeemMax)}). You have {pointsBalance}.</span>
              </label>
            )}
            {estimatedPoints > 0 && (
              <p className="text-secondary">
                You&rsquo;ll earn <strong>{estimatedPoints} points</strong> ({formatKES(estimatedPoints)}) once payment is confirmed.
                {subtotal < TIER_THRESHOLD && TIER_THRESHOLD - subtotal <= 8000 && (
                  <> Add {formatKES(TIER_THRESHOLD - subtotal)} more to earn 1.5% instead of 1%.</>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-card border border-border bg-surface p-4 text-sm text-muted">
            <Link href="/account/signup" className="font-medium text-primary hover:underline">Create an account</Link>{" "}
            (or{" "}
            <Link href="/account/login" className="font-medium text-primary hover:underline">log in</Link>) to get a KSh 200 welcome voucher
            on a first order of KSh 4,000 or more, and to earn points on this order.
          </div>
        )
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
          <label htmlFor="area" className="mb-1 block text-sm font-medium">Delivery Area</label>
          <select
            id="area"
            required
            value={areaSlug}
            onChange={(e) => { setAreaSlug(e.target.value); rememberArea(e.target.value); }}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="" disabled>Select where we&rsquo;re delivering…</option>
            <optgroup label="Nairobi — same-day delivery">
              {NAIROBI_ZONES.map((z) => (
                <option key={z.slug} value={z.slug}>
                  {z.name} — {feeLabel(z)}
                </option>
              ))}
            </optgroup>
            <optgroup label="Rest of Kenya">
              <option value={OUTSIDE_NAIROBI_SLUG}>Outside Nairobi (countrywide parcel)</option>
            </optgroup>
          </select>
          {delivery?.payOnDelivery && <p className="mt-1 text-xs text-muted">{OUTSIDE_NAIROBI_NOTE}</p>}
          {!delivery && (
            <p className="mt-1 text-xs text-muted">
              Can&rsquo;t find your area? Pick the nearest one and tell us on WhatsApp.
            </p>
          )}
        </div>

        {delivery?.range && (
          <div>
            <label htmlFor="building" className="mb-1 block text-sm font-medium">Building / Estate</label>
            <input
              id="building"
              required
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="e.g. name of your estate or apartment block"
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">
              {freeDelivery
                ? `Delivery to ${delivery.name} is free on orders over ${formatKES(FREE_DELIVERY_FROM)}.`
                : `Delivery to ${delivery.name} is ${delivery.range} depending on the building. You pay the top rate (KSh ${delivery.fee}) now, and we confirm the exact fee for your building on WhatsApp.`}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="mvp" className="mb-1 block text-sm font-medium">MVP code (optional)</label>
          <input
            id="mvp"
            value={mvpCode}
            onChange={(e) => setMvpCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Have an MVP code?"
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm uppercase outline-none focus:border-primary"
          />
          {mvpApplied && (
            <p className="mt-1 text-xs text-success">
              {mvpDiscount > 0 ? `MVP code applied: KSh ${mvpDiscount} off your delivery.` : "MVP code accepted. Pick a Nairobi area to see your delivery discount."}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium">Delivery Address</label>
          <textarea
            id="address"
            required
            rows={3}
            placeholder="Estate / building, street, landmark"
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

        <ErrorNotice error={error} context="placing an order" />

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
