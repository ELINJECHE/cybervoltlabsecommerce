"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent, type ConsentChoice } from "@/lib/consent";

const ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA4_ID);

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    if (readConsent() === null) setVisible(true);

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function choose(choice: ConsentChoice) {
    saveConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{ bottom: "calc(var(--cv-nav-h) + env(safe-area-inset-bottom, 0px) + var(--cv-sticky-h) + 12px)" }}
      className="fixed left-3 right-[5.5rem] z-[60] rounded-card border border-border bg-surface p-3 shadow-card sm:right-auto sm:max-w-sm lg:!bottom-4 lg:left-4"
    >
      <p className="text-xs leading-snug text-muted">
        We use cookies to remember you and see how the site is used (Google Analytics), so we can improve it.
        They are on unless you decline. <Link href="/privacy" className="underline">Privacy details</Link>.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="flex-1 rounded-full border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="flex-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          OK
        </button>
      </div>
    </div>
  );
}
