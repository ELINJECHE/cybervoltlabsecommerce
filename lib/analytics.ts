// Sends a GA4 event when GoogleAnalytics.tsx has loaded gtag; a no-op otherwise
// (no GA4 ID set, script blocked). Consent Mode still applies: until the visitor
// accepts cookies, GA receives a cookieless ping instead of a full event.
type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

export function trackEvent(name: string, params?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}
