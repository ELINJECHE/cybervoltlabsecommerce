import Link from "next/link";
import { DELIVERY_FEE, PRODUCT_DELIVERY_LINE } from "@/lib/delivery";
import { formatKES } from "@/lib/format";

// Cart: the flat delivery fee and the total paid on delivery, so the total holds no surprises.
export default function CartDelivery({ subtotal }: { subtotal: number }) {
  return (
    <div className="mt-2 rounded-card border border-border bg-surface p-3 text-sm">
      <div className="flex justify-between">
        <span>Delivery</span>
        <span className="font-medium">{formatKES(DELIVERY_FEE)}</span>
      </div>
      <div className="mt-1 flex justify-between font-semibold">
        <span>Total to pay on delivery</span>
        <span>{formatKES(subtotal + DELIVERY_FEE)}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {PRODUCT_DELIVERY_LINE}{" "}
        <Link href="/shipping" className="font-medium text-primary underline">Details</Link>
      </p>
    </div>
  );
}
