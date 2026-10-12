"use client";

import { useState } from "react";
import { formatKES } from "@/lib/format";
import { submitPaymentConfirmation, type OrderPayload } from "@/lib/orders";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import CheckoutSteps from "@/components/CheckoutSteps";

const MPESA_TILL = process.env.NEXT_PUBLIC_MPESA_TILL ?? "000000";

interface Props {
  order: OrderPayload;
  reason: string | null;
  onConfirmed: () => void;
}

export default function ManualPaymentConfirm({ order, reason, onConfirmed }: Props) {
  const [mpesaCode, setMpesaCode] = useState("");
  const [paidFromPhone, setPaidFromPhone] = useState(order.phone);
  const [paidAmount, setPaidAmount] = useState(String(order.subtotal));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whatsappLink = buildWhatsAppLink(
    `Hi Cybervolt Labs, I placed order ${order.orderReference} for ${formatKES(order.subtotal)} ` +
      `and paid via M-Pesa Till ${MPESA_TILL}. My M-Pesa confirmation code is: `
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitPaymentConfirmation(order, {
        mpesaCode: mpesaCode.trim().toUpperCase(),
        paidFromPhone: paidFromPhone.trim(),
        paidAmount: Number(paidAmount),
      });
      onConfirmed();
    } catch {
      setError(
        "We couldn't send your confirmation just now. Please try again, or send your M-Pesa code to us on WhatsApp."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CheckoutSteps current={2} />
      <h1 className="text-xl font-bold">Almost done — pay to complete your order</h1>
      <p className="mt-1 text-sm text-muted">
        Your order is saved, but it isn&rsquo;t paid yet. Follow the two steps below and we&rsquo;ll
        take it from there.
      </p>
      {reason && (
        <p className="mt-3 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{reason}</p>
      )}

      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Order reference</p>
        <p className="mt-1 text-2xl font-bold tracking-wide">{order.orderReference}</p>
        <p className="mt-1 text-sm text-muted">
          Keep this — quote it if you contact us about this order.
        </p>
      </div>

      <div className="mt-4 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
        <h2 className="mb-2 font-semibold text-success">2. Pay with M-Pesa</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Open M-Pesa → <strong className="text-foreground">Lipa na M-Pesa</strong> → <strong className="text-foreground">Buy Goods and Services</strong></li>
          <li>Till Number: <strong className="text-foreground">{MPESA_TILL}</strong></li>
          <li>Amount: <strong className="text-foreground">{formatKES(order.subtotal)}</strong></li>
          <li>Enter your M-Pesa PIN. You&rsquo;ll get an SMS with a confirmation code.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">3. Confirm your payment</h2>
          <p className="mt-1 text-sm text-muted">
            Once you&rsquo;ve paid, enter the code from your M-Pesa SMS so we can match your
            payment to this order and arrange delivery.
          </p>
        </div>

        <div>
          <label htmlFor="mpesaCode" className="mb-1 block text-sm font-medium">
            M-Pesa confirmation code
          </label>
          <input
            id="mpesaCode"
            required
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="e.g. SGH4K9XYZ1"
            pattern="[A-Za-z0-9]{8,12}"
            title="The 10-character code from your M-Pesa SMS (letters and numbers only)"
            value={mpesaCode}
            onChange={(e) => setMpesaCode(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm uppercase outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="paidFromPhone" className="mb-1 block text-sm font-medium">
            Phone number you paid from
          </label>
          <input
            id="paidFromPhone"
            type="tel"
            required
            value={paidFromPhone}
            onChange={(e) => setPaidFromPhone(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="paidAmount" className="mb-1 block text-sm font-medium">
            Amount paid (KES)
          </label>
          <input
            id="paidAmount"
            type="number"
            required
            min={1}
            step="any"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && <p className="rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {submitting ? "Sending..." : "Confirm My Payment"}
        </button>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target rounded-full border border-whatsapp py-3 text-center text-sm font-semibold text-whatsapp hover:brightness-95"
        >
          Or send the code on WhatsApp
        </a>
      </form>
    </div>
  );
}
