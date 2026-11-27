import { trackEvent } from "@/lib/analytics";

// Searches that found nothing, so synonyms can be added later (lib/search-synonyms.ts).
//  - Google Analytics: a "search_no_results" event with the search_term (Reports > Engagement > Events).
//  - This browser: the cv_zero_searches key in localStorage, most recent first, with counts. Handy while testing.
const KEY = "cv_zero_searches";
const seen = new Set<string>();

export function logZeroResultSearch(query: string) {
  const term = query.trim().toLowerCase().slice(0, 80);
  if (!term || seen.has(term)) return;
  seen.add(term);
  trackEvent("search_no_results", { search_term: term });
  try {
    const list: { q: string; n: number; last: string }[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const hit = list.find((e) => e.q === term);
    const next = hit
      ? list.map((e) => (e === hit ? { ...e, n: e.n + 1, last: new Date().toISOString() } : e))
      : [{ q: term, n: 1, last: new Date().toISOString() }, ...list];
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 50)));
  } catch { /* storage blocked */ }
}
