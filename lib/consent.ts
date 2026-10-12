export const CONSENT_KEY = "cv_consent";
export const OPEN_CONSENT_EVENT = "cv-open-consent";

export type ConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked — the choice still applies for this page view below.
  }
  window.gtag?.("consent", "update", { analytics_storage: choice });
}
