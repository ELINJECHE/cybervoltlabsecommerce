"use client";

import { feeLabel } from "@/lib/delivery";
import { useDeliveryArea } from "@/lib/use-delivery-area";
import { formatKES } from "@/lib/format";

// Cart: shows the delivery fee for the area chosen in the top bar, so the total holds no surprises.
export default function CartDelivery({ subtotal }: { subtotal: number }) {
  const { zone, outside } = useDeliveryArea();

  if (zone) {
    const lo = zone.minFee ?? zone.fee;
    return (
      <div className="mt-2 rounded-card border border-border bg-surface p-3 text-sm">
        <div className="flex justify-between">
          <span>Delivery to {zone.name}</span>
          <span className="font-medium">{feeLabel(zone)}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Estimated total</span>
          <span>{lo === zone.fee ? formatKES(subtotal + zone.fee) : `${formatKES(subtotal + lo)}–${formatKES(subtotal + zone.fee)}`}</span>
        </div>
        {lo !== zone.fee && <p className="mt-1 text-xs text-muted">The exact fee depends on your building; you pay the top rate at checkout.</p>}
      </div>
    );
  }
  if (outside) {
    return <p className="mt-2 text-xs text-muted">Outside Nairobi: the courier&rsquo;s parcel fee (about KSh 300–1,000) is paid on delivery.</p>;
  }
  return <p className="mt-2 text-xs text-muted">Choose your delivery area in the blue bar at the top to see your delivery fee. It is added at checkout.</p>;
}
