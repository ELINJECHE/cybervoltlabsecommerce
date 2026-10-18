"use client";

import { useEffect, useState } from "react";
import { NAIROBI_ZONES, OUTSIDE_NAIROBI_SLUG, feeLabel } from "@/lib/delivery";
import { deliveryHeadline, deliveryStatus, type DeliveryStatus } from "@/lib/delivery-clock";
import { useDeliveryArea } from "@/lib/use-delivery-area";
import { EXCLUSIVE_GROUP_URL } from "@/lib/community";

// Slim strip above the header on every page: the same-day promise with a live countdown, the
// customer's delivery area, and the free WhatsApp group. The area is remembered and used on
// product pages, the cart and checkout. It scrolls away; the sticky header below stays.
export default function DeliveryBanner() {
  // The clock only starts after mount, so the server HTML and first client render match.
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(deliveryStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { slug, setArea } = useDeliveryArea();

  return (
    <div className="bg-primary px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs sm:text-sm">
        <p className="text-center font-semibold">
          <span aria-hidden="true">🚚 </span>
          {status ? deliveryHeadline(status) : "Same-day delivery in Nairobi — dispatched within 2 hours"}
        </p>

        <label className="flex items-center gap-1.5">
          <span className="opacity-90">Delivering to</span>
          <select
            value={slug}
            onChange={(e) => setArea(e.target.value)}
            aria-label="Delivering to"
            className="max-w-[11rem] rounded bg-white/15 px-1.5 py-0.5 font-semibold text-white outline-none focus:bg-white/25"
          >
            <option value="" className="text-foreground">Choose area</option>
            <optgroup label="Nairobi">
              {NAIROBI_ZONES.map((z) => (
                <option key={z.slug} value={z.slug} className="text-foreground">
                  {z.name} · {feeLabel(z)}
                </option>
              ))}
            </optgroup>
            <option value={OUTSIDE_NAIROBI_SLUG} className="text-foreground">Outside Nairobi (parcel)</option>
          </select>
        </label>

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
