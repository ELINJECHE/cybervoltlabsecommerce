"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { AppError } from "@/lib/errors";

// The red box for customer-facing errors: a plain sentence, plus the reference code and a
// WhatsApp link that already quotes it. Only the code (never personal data) goes to analytics.
export default function ErrorNotice({ error, context, className = "" }: {
  error: AppError | null;
  /** What the customer was doing, e.g. "logging in", used in the WhatsApp message. */
  context?: string;
  className?: string;
}) {
  const code = error?.code;
  useEffect(() => {
    if (code) trackEvent("app_error", { code });
  }, [code]);

  if (!error) return null;
  return (
    <div role="alert" className={`rounded-md bg-deal/10 px-3 py-2 text-sm text-deal ${className}`}>
      <p>{error.message}</p>
      {code && (
        <p className="mt-1 text-xs opacity-90">
          Reference {code} ·{" "}
          <a
            href={buildWhatsAppLink(`Hi Cybervolt Labs, I hit error ${code}${context ? ` while ${context}` : ""}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            Message us on WhatsApp
          </a>
        </p>
      )}
    </div>
  );
}
