"use client";

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
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface p-4 shadow-card"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          We use cookies only to measure how the site is used (Google Analytics) so we can improve
          it. You can change your choice anytime from &ldquo;Cookie settings&rdquo; in the footer.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="tap-target flex-1 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-light sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="tap-target flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
