"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatKES } from "@/lib/format";
import { submitPaymentConfirmation, type OrderPayload } from "@/lib/orders";
import { parseMpesaMessage } from "@/lib/mpesa-sms";
import { MPESA_TILL, TILL_NAME, ORDER_HOLD_TIME } from "@/lib/store-info";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import CheckoutSteps from "@/components/CheckoutSteps";
import CopyButton from "@/components/CopyButton";

interface Props {
  order: OrderPayload;
  reason: string | null;
  onConfirmed: (mpesaCode: string) => void;
}

const CODE_PATTERN = /^[A-Z0-9]{8,12}$/;

export default function ManualPaymentConfirm({ order, reason, onConfirmed }: Props) {
  const amountDue = order.total ?? order.subtotal;
  const [pasted, setPasted] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [paidFromPhone, setPaidFromPhone] = useState(order.phone);
  const [paidAmount, setPaidAmount] = useState(String(amountDue));
  const [manual, setManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseMpesaMessage(pasted), [pasted]);
  const pasteFailed = pasted.trim().length > 0 && !parsed.code;
  const showFields = manual || pasteFailed;

  function handlePaste(text: string) {
    setPasted(text);
    const found = parseMpesaMessage(text);
    if (found.code) setMpesaCode(found.code);
    if (found.amount) setPaidAmount(String(found.amount));
  }

  const chatLink = buildWhatsAppLink(
    `Hi Cybervolt Labs, I'm about to pay for order ${order.orderReference} (${formatKES(amountDue)}) ` +
      `and have a question: `
  );
  const payLink = buildWhatsAppLink(
    `Hi Cybervolt Labs, I placed order ${order.orderReference} for ${formatKES(amountDue)} ` +
      `and paid via M-Pesa Till ${MPESA_TILL}. My M-Pesa confirmation code is: `
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const code = mpesaCode.trim().toUpperCase();
    const amount = Number(paidAmount);
    if (!CODE_PATTERN.test(code) || !(amount > 0) || !paidFromPhone.trim()) {
      setManual(true);
      setError(
        "Please paste your M-Pesa message, or enter the confirmation code (the 10 letters and numbers at the start of the SMS)."
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitPaymentConfirmation(order, {
        mpesaCode: code,
        paidFromPhone: paidFromPhone.trim(),
        paidAmount: amount,
      });
      onConfirmed(code);
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
        Your order is saved, but it isn&rsquo;t paid yet. Follow the steps below and we&rsquo;ll take
        it from there.
      </p>
      {reason && <p className="mt-3 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{reason}</p>}

      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Order reference</p>
        <p className="mt-1 text-2xl font-bold tracking-wide">{order.orderReference}</p>
        <p className="mt-1 text-sm text-muted">Keep this — quote it if you contact us.</p>
      </div>

      <div className="mt-4 rounded-card border border-border bg-surface p-4 text-sm">
        <h2 className="mb-2 font-semibold">Your order</h2>
        <ul className="flex flex-col gap-1">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.color ?? ""}`} className="flex justify-between gap-3">
              <span>
                {item.name}
                {item.color ? ` (${item.color})` : ""} × {item.quantity}
              </span>
              <span className="shrink-0">{formatKES(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.deliveryArea && (
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span>Delivery{order.deliveryPayOnArrival ? "" : ` (${order.deliveryArea})`}</span>
            <span>{order.deliveryPayOnArrival ? "Pay courier on arrival" : formatKES(order.deliveryFee ?? 0)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
          <span>Total to pay now</span>
          <span>{formatKES(amountDue)}</span>
        </div>
        <dl className="mt-3 grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1">
          <dt className="text-muted">Deliver to</dt>
          <dd>{order.deliveryAddress}</dd>
          <dt className="text-muted">Phone</dt>
          <dd>{order.phone}</dd>
        </dl>
        <p className="mt-3 text-muted">
          {ORDER_HOLD_TIME ? `We'll hold this order for ${ORDER_HOLD_TIME}. ` : ""}
          Nothing is charged until you pay.{" "}
          <Link href="/returns" className="font-medium text-primary underline">
            Return policy
          </Link>
        </p>
      </div>

      <a
        href={chatLink}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target mt-3 flex items-center justify-center rounded-full border border-whatsapp py-3 text-sm font-semibold text-whatsapp hover:brightness-95"
      >
        💬 Not sure yet? Chat with us before you pay
      </a>

      <div className="mt-4 rounded-card border border-success/30 bg-success/5 p-4 text-sm">
        <h2 className="mb-2 font-semibold">2. Pay with M-Pesa</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>
            Open M-Pesa → <strong className="text-foreground">Lipa na M-Pesa</strong> →{" "}
            <strong className="text-foreground">Buy Goods and Services</strong>
          </li>
          <li>Enter the Till number and amount below, then your PIN</li>
        </ol>

        <div className="mt-3 flex items-center justify-between rounded-md border border-success/30 bg-surface px-3 py-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Till number</p>
            <p className="text-xl font-bold tracking-wide">{MPESA_TILL}</p>
          </div>
          <CopyButton value={MPESA_TILL} label="Till number" />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-md border border-success/30 bg-surface px-3 py-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Amount</p>
            <p className="text-xl font-bold tracking-wide">{formatKES(amountDue)}</p>
          </div>
          <CopyButton value={String(amountDue)} label="amount" />
        </div>

        {TILL_NAME && (
          <p className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-muted">
            🛡️ <strong className="text-foreground">Safety check:</strong> before you enter your PIN,
            M-Pesa should show the name <strong className="text-foreground">{TILL_NAME}</strong>. If
            it shows anything else, stop and message us.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">3. Confirm your payment</h2>
        <p className="mt-1 text-sm text-muted">
          Paste the M-Pesa SMS you received and we&rsquo;ll pick out the details.
        </p>

        <label htmlFor="mpesaMessage" className="sr-only">
          M-Pesa confirmation message
        </label>
        <textarea
          id="mpesaMessage"
          rows={4}
          value={pasted}
          onChange={(e) => handlePaste(e.target.value)}
          placeholder="Paste your M-Pesa message here"
          className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
        />

        {parsed.code && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-foreground">
              ✓ Code {parsed.code}
            </span>
            {parsed.amount && (
              <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-foreground">
                ✓ Amount {formatKES(parsed.amount)}
              </span>
            )}
          </div>
        )}
        {pasteFailed && (
          <p className="mt-2 text-sm text-deal">
            We couldn&rsquo;t find the confirmation code in that message — please type it below.
          </p>
        )}

        {!showFields && (
          <button
            type="button"
            onClick={() => setManual(true)}
            className="mt-2 text-sm font-medium text-primary underline"
          >
            Or type the details yourself
          </button>
        )}

        {showFields && (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label htmlFor="mpesaCode" className="mb-1 block text-sm font-medium">
                M-Pesa confirmation code
              </label>
              <input
                id="mpesaCode"
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="e.g. SGH4K9XYZ1"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm uppercase outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="paidAmount" className="mb-1 block text-sm font-medium">
                Amount paid (KES)
              </label>
              <input
                id="paidAmount"
                type="number"
                min={1}
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="paidFromPhone" className="mb-1 block text-sm font-medium">
                Phone number you paid from
              </label>
              <input
                id="paidFromPhone"
                type="tel"
                value={paidFromPhone}
                onChange={(e) => setPaidFromPhone(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {error && <p className="mt-3 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target mt-4 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {submitting ? "Sending..." : "Confirm my payment"}
        </button>

        <a
          href={payLink}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target mt-3 flex items-center justify-center rounded-full border border-whatsapp py-3 text-sm font-semibold text-whatsapp hover:brightness-95"
        >
          Or send the code on WhatsApp
        </a>
      </form>
    </div>
  );
}
