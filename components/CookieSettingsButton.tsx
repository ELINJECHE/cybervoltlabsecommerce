"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

export default function CookieSettingsButton({ className = "text-xs text-white/50 hover:text-white" }: { className?: string }) {
  if (!process.env.NEXT_PUBLIC_GA4_ID) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className}
    >
      Cookie settings
    </button>
  );
}
