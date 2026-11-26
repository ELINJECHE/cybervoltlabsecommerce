export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function percentOff(price: number, discountPrice: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

// "Black, size 42" for an order line, from whichever of colour and size it has.
export function variantLabel(item: { color?: string; size?: string }): string {
  return [item.color, item.size ? `size ${item.size}` : ""].filter(Boolean).join(", ");
}
