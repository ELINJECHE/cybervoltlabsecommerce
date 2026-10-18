"use client";

import { useEffect, useState } from "react";
import { formatKES } from "@/lib/format";
import { readLastOrder, type LastOrderSummary } from "@/lib/orders";
import { DELIVERY_ESTIMATE } from "@/lib/store-info";
import { EXCLUSIVE_GROUP_URL, MVP_CODE, MVP_DELIVERY_DISCOUNT, MVP_GROUP_URL } from "@/lib/community";
import { buildWhatsAppLink } from "@/lib/whatsapp";

function buildReceiptLink(order: LastOrderSummary): string {
  const items = order.items
    .map((i) => `• ${i.name}${i.color ? ` (${i.color})` : ""} × ${i.quantity}`)
    .join("\n");
  const lines = [
    "Hi Cybervolt Labs, here is my order receipt.",
    `Order: ${order.reference}`,
    items,
    `Total: ${formatKES(order.total)}`,
    order.mpesaCode ? `M-Pesa code: ${order.mpesaCode}` : null,
    `Deliver to: ${order.address}`,
    `Phone: ${order.phone}`,
  ].filter(Boolean);
  return buildWhatsAppLink(lines.join("\n"));
}

export default function LastOrderDetails() {
  const [order, setOrder] = useState<LastOrderSummary | null>(null);

  useEffect(() => {
    setOrder(readLastOrder());
  }, []);

  return (
    <>
      {order?.reference && (
        <p className="mt-3 text-sm text-muted">
          Order reference: <strong className="text-foreground">{order.reference}</strong>
        </p>
      )}

      <div className="mt-6 rounded-card border border-border bg-surface p-4 text-left text-sm">
        <h2 className="mb-2 font-semibold">What happens next</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>We confirm your M-Pesa payment.</li>
          <li>
            We contact you{order?.phone ? ` on ${order.phone}` : ""} to confirm your delivery details.
          </li>
          <li>
            Your order is processed and dispatched{order?.address ? ` to ${order.address}` : ""}
            {DELIVERY_ESTIMATE ? ` — ${DELIVERY_ESTIMATE}` : ""}.
          </li>
        </ol>
        <p className="mt-3 text-muted">
          Questions? Message us on WhatsApp and quote your order reference.
        </p>
      </div>

      <div className="mt-4 rounded-card border border-primary/30 bg-primary/5 p-4 text-left text-sm">
        <h2 className="mb-1 font-semibold text-primary">🎉 You&rsquo;ve unlocked MVP Access</h2>
        <p className="text-muted">
          Customers who have ordered join our MVP group for first pick of new stock. Use code{" "}
          <strong className="text-foreground">{MVP_CODE}</strong> on your next order for KSh {MVP_DELIVERY_DISCOUNT} off delivery.
        </p>
        <a
          href={MVP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target mt-3 flex items-center justify-center rounded-full bg-whatsapp py-2.5 text-sm font-semibold text-white hover:brightness-95"
        >
          Join MVP Access on WhatsApp
        </a>
        <p className="mt-2 text-xs text-muted">
          Prefer to just follow new drops?{" "}
          <a href={EXCLUSIVE_GROUP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
            Join the free group
          </a>
          .
        </p>
      </div>

      {order?.reference && (
        <div className="mt-4">
          <a
            href={buildReceiptLink(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target flex items-center justify-center rounded-full bg-whatsapp py-3 text-sm font-semibold text-white hover:brightness-95"
          >
            📱 Send my receipt to WhatsApp
          </a>
          <p className="mt-2 text-xs text-muted">
            Opens a chat with your order summary, so you have a record on your phone.
          </p>
        </div>
      )}
    </>
  );
}
