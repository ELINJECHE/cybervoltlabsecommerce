"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

// The two WhatsApp buttons we measure: "Chat Nami" (personal, on product pages)
// and "Chat Nasi" (the shop, everywhere else). Each click is a GA4
// `whatsapp_chat` event, so the two can be compared in Reports -> Engagement -> Events.
export type ChatButton = "chat_nami" | "chat_nasi";

export default function WhatsAppChatLink({
  href,
  button,
  placement,
  product,
  className,
  children,
}: {
  href: string;
  button: ChatButton;
  placement: string;
  product?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("whatsapp_chat", { button, placement, ...(product ? { product } : {}) })}
      className={className}
    >
      {children}
    </a>
  );
}
