// Where a visitor came from (a link tagged ?utm_source=tiktok, or the site that sent them), remembered in
// the browser and written into the order notes, so every order has a known source. First-party, no cookies.
export const SOURCE_KEY = "cv_source";

export function captureSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source");
    let found = "";
    if (utm) {
      found = [utm, params.get("utm_medium"), params.get("utm_campaign")].filter(Boolean).join("/").toLowerCase().slice(0, 60);
    } else if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== window.location.hostname.replace(/^www\./, "")) found = host.slice(0, 60);
    }
    const stored = localStorage.getItem(SOURCE_KEY);
    if (found) localStorage.setItem(SOURCE_KEY, found);   // a tagged or outside link wins
    else if (!stored) localStorage.setItem(SOURCE_KEY, "direct");
  } catch { /* storage blocked or odd referrer: skip */ }
}

export function readSource(): string {
  try { return localStorage.getItem(SOURCE_KEY) || "direct"; } catch { return "direct"; }
}
