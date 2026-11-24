"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DELIVERY_SUMMARY } from "@/lib/delivery";
import { deliveryHeadline, deliveryStatus, type DeliveryStatus } from "@/lib/delivery-clock";
import { EXCLUSIVE_GROUP_URL } from "@/lib/community";

// Slim strip above the header on every page: the dispatch countdown, the delivery terms and
// the free WhatsApp group. It scrolls away; the sticky header below stays.
export default function DeliveryBanner() {
  // The clock only starts after mount, so the server HTML and first client render match.
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(deliveryStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-primary px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs sm:text-sm">
        <p className="text-center font-semibold">
          <span aria-hidden="true">🚚 </span>
          {status ? deliveryHeadline(status) : DELIVERY_SUMMARY}
        </p>

        <Link href="/shipping" className="underline underline-offset-2 opacity-90 hover:opacity-100">
          Ksh 999 delivery anywhere in Kenya · Pay on delivery
        </Link>

        <a
          href={EXCLUSIVE_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden font-semibold underline underline-offset-2 hover:opacity-90 md:inline"
        >
          Join our free WhatsApp drops
        </a>
      </div>
    </div>
  );
}
