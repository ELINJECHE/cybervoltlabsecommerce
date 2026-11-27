"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PICKUP_LINE, PRODUCT_DELIVERY_LINE } from "@/lib/delivery";
import { deliveryHeadline, deliveryStatus, type DeliveryStatus } from "@/lib/delivery-clock";

// On a product page: the delivery terms (worded as in Google Merchant Center) and the dispatch countdown.
export default function ProductDelivery() {
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(deliveryStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-card border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <p className="font-semibold text-primary">
        <span aria-hidden="true">🚚 </span>
        {PRODUCT_DELIVERY_LINE}
      </p>
      <p className="mt-0.5 text-muted">{PICKUP_LINE}</p>
      {status && <p className="mt-0.5 text-muted">{deliveryHeadline(status)}</p>}
      <Link href="/shipping" className="mt-0.5 inline-block text-xs font-semibold text-primary underline underline-offset-2">
        Delivery &amp; returns details
      </Link>
    </div>
  );
}
