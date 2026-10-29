"use client";

import { useCart } from "@/lib/cart-context";
import { buildShareLink } from "@/lib/whatsapp";
import { formatKES } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

// "Send my cart to WhatsApp": a ready-made message with the items and total that the shopper can send to themselves,
// a partner or a friend before deciding (it keeps the cart alive in the chat they already use), or to us for help.
export default function CartToWhatsApp() {
  const { items, subtotal } = useCart();
  if (items.length === 0) return null;
  const lines = items.map((i) => `• ${i.quantity} x ${i.name}${i.color ? ` (${i.color})` : ""}: ${formatKES(i.unitPrice * i.quantity)}`);
  const text = `My Cybervolt Labs cart:\n${lines.join("\n")}\nItems total: ${formatKES(subtotal)}\nhttps://cybervoltlabs.co.ke/cart`;
  return (
    <a
      href={buildShareLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("share", { method: "whatsapp", content_type: "cart" })}
      className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold text-foreground hover:border-whatsapp hover:text-whatsapp"
    >
      <span aria-hidden="true">💬</span> Send my cart to WhatsApp
    </a>
  );
}
