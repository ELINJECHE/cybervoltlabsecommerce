"use client";

import { useEffect } from "react";
import { DEFAULT_CONSENT, readConsent } from "@/lib/consent";
import { readLastOrder } from "@/lib/orders";

// Merchant Center ID (Google Customer Reviews -> Set up integration). Public: it is in the page source by design.
const MERCHANT_ID = 5917675868;
const PLATFORM_SRC = "https://apis.google.com/js/platform.js?onload=renderOptIn";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: { load: (name: string, cb: () => void) => void; surveyoptin: { render: (opts: Record<string, unknown>) => void } };
  }
}

// Google Customer Reviews opt-in for the order confirmation page. Shows only when the customer gave an email (or is logged in)
// and has not declined cookies; otherwise it renders nothing and loads nothing from Google.
export default function GoogleCustomerReviewsOptIn() {
  useEffect(() => {
    if ((readConsent() ?? DEFAULT_CONSENT) !== "granted") return;
    const order = readLastOrder();
    if (!order?.reference || !order.email || !EMAIL_PATTERN.test(order.email) || !order.estimatedDelivery) return;
    if (document.querySelector(`script[src="${PLATFORM_SRC}"]`)) return;

    window.renderOptIn = () => {
      window.gapi?.load("surveyoptin", () => {
        window.gapi?.surveyoptin.render({
          merchant_id: MERCHANT_ID,
          order_id: order.reference,
          email: order.email,
          delivery_country: "KE",
          estimated_delivery_date: order.estimatedDelivery,
        });
      });
    };
    const script = document.createElement("script");
    script.src = PLATFORM_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
