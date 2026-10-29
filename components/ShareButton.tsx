"use client";

import { buildShareLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

// "Share on WhatsApp": sends the product page link to a friend or family member to ask "what do you think?".
// Shopping here is social (WhatsApp groups), so this brings in new visitors and nudges the decision.
export default function ShareButton({ name, slug, price }: { name: string; slug: string; price: number }) {
  const url = `https://cybervoltlabs.co.ke/product/${slug}`;
  return (
    <a
      href={buildShareLink(`Check this out on Cybervolt Labs: ${name}, KSh ${price.toLocaleString("en-KE")}\n${url}`)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("share", { method: "whatsapp", content_type: "product", item_id: slug })}
      className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted hover:border-whatsapp hover:text-whatsapp"
    >
      <span aria-hidden="true">↗</span> Share on WhatsApp
    </a>
  );
}
