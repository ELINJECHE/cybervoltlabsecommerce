"use client";

import { FREE_DELIVERY_FROM, feeLabel, freeDeliveryApplies } from "@/lib/delivery";
import { useDeliveryArea } from "@/lib/use-delivery-area";
import { formatKES } from "@/lib/format";

// Cart: shows the delivery fee for the area chosen in the top bar, so the total holds no surprises.
export default function CartDelivery({ subtotal }: { subtotal: number }) {
  const { zone, outside } = useDeliveryArea();
  const free = freeDeliveryApplies(subtotal, zone ? { payOnDelivery: false } : null);
  const toGo = Math.max(0, FREE_DELIVERY_FROM - subtotal);
  // Progress toward free delivery in Nairobi (the nudge that lifts basket size).
  const progress = (
    <div className="mt-2 rounded-card border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="font-semibold text-primary">
        {subtotal >= FREE_DELIVERY_FROM ? "🎉 You've unlocked FREE delivery in Nairobi" : `Add ${formatKES(toGo)} more for FREE delivery in Nairobi`}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_DELIVERY_FROM} aria-valuenow={Math.min(subtotal, FREE_DELIVERY_FROM)}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">Free delivery on orders over {formatKES(FREE_DELIVERY_FROM)}.</p>
    </div>
  );

  if (zone) {
    const lo = zone.minFee ?? zone.fee;
    return (
      <>
      {progress}
      <div className="mt-2 rounded-card border border-border bg-surface p-3 text-sm">
        <div className="flex justify-between">
          <span>Delivery to {zone.name}</span>
          <span className="font-medium">{free ? "FREE" : feeLabel(zone)}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Estimated total</span>
          <span>{free ? formatKES(subtotal) : lo === zone.fee ? formatKES(subtotal + zone.fee) : `${formatKES(subtotal + lo)}–${formatKES(subtotal + zone.fee)}`}</span>
        </div>
        {!free && lo !== zone.fee && <p className="mt-1 text-xs text-muted">The exact fee depends on your building; you pay the top rate at checkout.</p>}
      </div>
      </>
    );
  }
  if (outside) {
    return <p className="mt-2 text-xs text-muted">Outside Nairobi: the courier&rsquo;s parcel fee (about KSh 300–1,000) is paid on delivery. Free delivery over {formatKES(FREE_DELIVERY_FROM)} applies inside Nairobi.</p>;
  }
  return <>{progress}<p className="mt-2 text-xs text-muted">Choose your delivery area in the blue bar at the top to see your delivery fee. It is added at checkout.</p></>;
}
