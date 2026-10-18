"use client";

import { useEffect, useState } from "react";
import { feeLabel } from "@/lib/delivery";
import { deliveryHeadline, deliveryStatus, type DeliveryStatus } from "@/lib/delivery-clock";
import { useDeliveryArea } from "@/lib/use-delivery-area";
import { formatKES } from "@/lib/format";

// On a product page: the same-day countdown plus the real total to the visitor's area.
export default function ProductDelivery({ price }: { price: number }) {
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(deliveryStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const { zone, outside } = useDeliveryArea();

  let line: string;
  if (zone) {
    const lo = zone.minFee ?? zone.fee;
    line = lo === zone.fee
      ? `Delivery to ${zone.name}: ${formatKES(zone.fee)} · Total ${formatKES(price + zone.fee)}`
      : `Delivery to ${zone.name}: ${feeLabel(zone)} · Total ${formatKES(price + lo)}–${formatKES(price + zone.fee)}`;
  } else if (outside) {
    line = "Outside Nairobi: parcel courier fee (about KSh 300–1,000) is paid on delivery";
  } else {
    line = "Choose your area in the blue bar at the top to see your total with delivery";
  }

  return (
    <div className="rounded-card border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <p className="font-semibold text-primary">
        <span aria-hidden="true">🚚 </span>
        {status ? deliveryHeadline(status) : "Same-day delivery in Nairobi — dispatched within 2 hours"}
      </p>
      <p className="mt-0.5 text-muted">{line}</p>
    </div>
  );
}
