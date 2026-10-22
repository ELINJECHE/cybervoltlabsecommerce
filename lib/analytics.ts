// Sends a GA4 event when GoogleAnalytics.tsx has loaded gtag; a no-op otherwise
// (no GA4 ID set, script blocked). Consent Mode still applies: until the visitor
// accepts cookies, GA receives a cookieless ping instead of a full event.
type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

// GA4's standard shop events (view_item, add_to_cart, begin_checkout, purchase) give the full journey
// in Analytics' monetisation reports. Prices are in KSh.
export interface ShopLine { id: string; name: string; price: number; quantity?: number }

const toItems = (lines: ShopLine[]) =>
  lines.map((l) => ({ item_id: l.id, item_name: l.name, price: l.price, quantity: l.quantity ?? 1 }));

export function trackShop(
  name: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  lines: ShopLine[],
  extra?: { transactionId?: string; shipping?: number },
) {
  const value = lines.reduce((sum, l) => sum + l.price * (l.quantity ?? 1), 0);
  trackEvent(name, {
    currency: "KES",
    value,
    items: toItems(lines),
    ...(extra?.transactionId ? { transaction_id: extra.transactionId } : {}),
    ...(extra?.shipping !== undefined ? { shipping: extra.shipping } : {}),
  });
}
