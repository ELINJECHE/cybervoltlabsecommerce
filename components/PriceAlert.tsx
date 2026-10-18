"use client";

import { useEffect, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { formatKES } from "@/lib/format";

const KEY = "cv_price_alerts";

// "Tell me if the price drops": opens a WhatsApp message to the shop with the product and today's
// price filled in. The shop replies by hand; nothing is automatic, and the page says so.
export default function PriceAlert({ slug, name, price }: { slug: string; name: string; price: number }) {
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    try { setAsked((JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]).includes(slug)); } catch { /* ignore */ }
  }, [slug]);

  function onClick() {
    trackEvent("price_alert_request", { product: slug });
    try {
      const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
      if (!all.includes(slug)) localStorage.setItem(KEY, JSON.stringify([slug, ...all].slice(0, 50)));
    } catch { /* ignore */ }
    setAsked(true);
    const link = buildWhatsAppLink(
      `Hi Cybervolt Labs, please message me if the price of "${name}" drops below ${formatKES(price)}.\n${window.location.href}`
    );
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted hover:border-primary hover:text-primary"
      >
        🔔 {asked ? "Price alert requested" : "Tell me if the price drops"}
      </button>
      {asked && <p className="mt-1 text-xs text-muted">Send the WhatsApp message and we&rsquo;ll reply personally if it drops.</p>}
    </div>
  );
}
