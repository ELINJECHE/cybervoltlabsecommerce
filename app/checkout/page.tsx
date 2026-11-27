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
import { getStoreReviews } from "@/lib/reviews";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import CartSkeleton from "@/components/CartSkeleton";
import CheckoutSteps from "@/components/CheckoutSteps";
import { MVP_CODE, MVP_DELIVERY_DISCOUNT } from "@/lib/community";
import { LOYALTY_V2, TIER_THRESHOLD, maxRedeemable, pointsEarned } from "@/lib/loyalty";
import { supabase } from "@/lib/supabase";
import { trackShop } from "@/lib/analytics";
import { readSource } from "@/lib/source";
import ErrorNotice from "@/components/ErrorNotice";
import { estimatedDeliveryDate } from "@/lib/delivery-clock";
import { toAppError, type AppError } from "@/lib/errors";
import { COURIER, DELIVERY_FEE, PICKUP_AREA, PRODUCT_DELIVERY_LINE, SHOP_ADDRESS, describeDelivery, describePickup } from "@/lib/delivery";
import { PHONE_ERROR, normalizeKenyanMobile } from "@/lib/phone";

// Every order is paid on delivery: placing it books it with the shop, and the customer pays
// the total (goods + the flat delivery fee) when they collect or receive the parcel.

export default function CheckoutPage() {
  const { items, subtotal, clearCart, ready } = useCart();
  const { user, pointsBalance, welcomeVoucher, refreshPoints, refreshVoucher } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [mvpCode, setMvpCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  // Delivered by the courier (flat fee) or collected free at the shop.
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const pickup = method === "pickup";
  // Goods + the delivery fee (nothing for pickup). The promo code takes KSh 100 off the delivery fee.
  const mvpApplied = mvpCode.trim().toUpperCase() === MVP_CODE;
  const deliveryFee = pickup ? 0 : DELIVERY_FEE;
  const mvpDiscount = mvpApplied ? Math.min(MVP_DELIVERY_DISCOUNT, deliveryFee) : 0;
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
  // Once per visit to this page, as soon as the saved cart has loaded.
  const startedCheckout = useRef(false);
  useEffect(() => {
    if (startedCheckout.current || items.length === 0) return;
    startedCheckout.current = true;
    trackShop("begin_checkout", items.map((i) => ({ id: i.productId, name: i.name, price: i.unitPrice, quantity: i.quantity })));
  }, [items]);
  function finishCheckout(completed: OrderPayload) {
    trackShop(
      "purchase",
      completed.items.map((i) => ({ id: i.productId, name: i.name, price: i.unitPrice, quantity: i.quantity })),
      { transactionId: completed.orderReference, shipping: completed.deliveryFee ?? 0 },
    );
    saveLastOrder(completed, undefined, {
      email: email.trim() || user?.email || undefined,
      estimatedDelivery: pickup ? undefined : estimatedDeliveryDate(),
    });
    clearCart();
    router.push("/checkout/success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedPhone = normalizeKenyanMobile(phone);
    if (!normalizedPhone) {
      setPhoneError(true);
      document.getElementById("phone")?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);

    const orderReference = generateOrderReference();
    const payload: OrderPayload = {
      type: "order",
      orderReference,
      customerName: name,
      phone: normalizedPhone,
      deliveryAddress: pickup ? `Collect at our shop: ${SHOP_ADDRESS}` : address,
      notes: tagOrderNotes(
        orderReference,
        pickup ? "PICKUP · PAY ON COLLECTION" : "PAY ON DELIVERY",
        [pickup ? describePickup() : describeDelivery(deliveryFee - mvpDiscount), `Source: ${readSource()}`, mvpDiscount > 0 ? `MVP code ${MVP_CODE} (-KSh ${mvpDiscount} delivery)` : "", voucherOff > 0 ? `Welcome voucher (-KSh ${voucherOff})` : "", pointsOff > 0 ? `Points used (-KSh ${pointsOff})` : "", `Total to pay on ${pickup ? "collection" : "delivery"} KSh ${total}`, notes.trim()].filter(Boolean).join(" · ")
      ),
      items,
      subtotal,
      deliveryArea: pickup ? PICKUP_AREA : COURIER,
      deliveryMethod: method,
      deliveryFee: deliveryFee - mvpDiscount,
      deliveryPayOnArrival: true,
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
      // Order-of-record webhook.
      await submitOrder(payload);
    } catch (err) {
      setError(toAppError(err, "CV-ORDER-02"));
      setSubmitting(false);
      return;
    }

    if (!recorded) await recordShopOrder(payload);
    if (voucherOff > 0 || pointsOff > 0) await Promise.all([refreshPoints(), refreshVoucher()]);
    setSubmitting(false);
    finishCheckout(payload);
  }

  if (!ready) return <CartSkeleton title="Checkout" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Add a product before checking out.</p>
      </div>
    );
  }

  return (
    <div>
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Checkout</h1>
      <p className="mb-4 text-sm font-medium text-primary">🚚 {PRODUCT_DELIVERY_LINE}</p>
      <CheckoutSteps current={1} />

      <div className="mb-6 rounded-card border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold">Order Summary</h2>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {items.map((item) => (
            <li key={`${item.productId}-${item.color ?? ""}-${item.size ?? ""}`} className="flex justify-between">
              <span className="line-clamp-1">
                {item.name}{item.size ? ` (size ${item.size})` : ""} × {item.quantity}
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
          <span>{pickup ? "Collect at our shop" : `Delivery (${COURIER})`}</span>
          <span>{pickup ? "Free" : formatKES(deliveryFee)}</span>
        </div>
        {mvpDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-success">
            <span>Promo code</span>
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
          <span>{pickup ? "Total to pay on collection" : "Total to pay on delivery"}</span>
          <span>{formatKES(total)}</span>
        </div>
      </div>

      <div className="mb-6 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
        <h2 className="mb-1 font-semibold text-success">{pickup ? "Pay when you collect" : "Pay on delivery"}</h2>
        <p className="text-muted">
          {pickup
            ? "Fill in your details and place your order. Nothing to pay now: you pay at our shop when you collect it. We will contact you when it is ready."
            : "Fill in your details and place your order. Nothing to pay now: you pay when you collect or receive your parcel. Orders placed before 2:00 PM East Africa Time are dispatched the same day."}
        </p>
      </div>

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
                You&rsquo;ll earn <strong>{estimatedPoints} points</strong> ({formatKES(estimatedPoints)}) once your order is paid.
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
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How would you like to get your order?</legend>
          <div className="flex flex-col gap-2">
            {([
              { id: "delivery", title: `Delivery via ${COURIER}, Ksh ${DELIVERY_FEE.toLocaleString("en-KE")} (1-2 days)` },
              { id: "pickup", title: `Collect at our shop, Free (${SHOP_ADDRESS.replace(", Ground Floor", "")})` },
            ] as const).map((opt) => (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-card border p-3 text-sm ${method === opt.id ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value={opt.id}
                  checked={method === opt.id}
                  onChange={() => setMethod(opt.id)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span className="font-medium">{opt.title}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Full Name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="07XX XXX XXX"
            value={phone}
            aria-invalid={phoneError}
            aria-describedby={phoneError ? "phone-error" : undefined}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError && normalizeKenyanMobile(e.target.value)) setPhoneError(false);
            }}
            onBlur={() => setPhoneError(phone.trim() !== "" && !normalizeKenyanMobile(phone))}
            className={`h-11 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:border-primary ${phoneError ? "border-deal" : "border-border"}`}
          />
          {phoneError && (
            <p id="phone-error" role="alert" className="mt-1 text-xs text-deal">
              {PHONE_ERROR}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email (optional)</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={user?.email ?? "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">
            Only used to invite you to review your order through Google Customer Reviews. You can say no when asked.
          </p>
        </div>

        <div>
          {promoOpen ? (
            <>
              <label htmlFor="promo" className="mb-1 block text-sm font-medium">Promo code (optional)</label>
              <input
                id="promo"
                value={mvpCode}
                onChange={(e) => setMvpCode(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Enter your promo code"
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm uppercase outline-none focus:border-primary"
              />
              {mvpApplied && mvpDiscount > 0 && (
                <p className="mt-1 text-xs text-success">
                  Promo code applied: KSh {mvpDiscount} off your delivery.
                </p>
              )}
              {mvpApplied && mvpDiscount === 0 && pickup && (
                <p className="mt-1 text-xs text-muted">This code takes money off delivery, and collecting at our shop has no delivery fee.</p>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              aria-expanded={false}
              className="min-h-11 text-sm font-medium text-primary underline underline-offset-2"
            >
              Have a promo code?
            </button>
          )}
        </div>

        {!pickup && (
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium">Delivery Address</label>
            <textarea
              id="address"
              name="address"
              autoComplete="street-address"
              required
              rows={3}
              placeholder="Town, estate / building, street, landmark"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        )}

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
          {submitting ? "Placing Order..." : pickup ? "Place Order (Pay on Collection)" : "Place Order (Pay on Delivery)"}
        </button>
      </form>
    </div>

    <ReviewsCarousel reviews={getStoreReviews()} />
    </div>
  );
}
