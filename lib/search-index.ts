"use client";

import type { SearchDoc } from "@/lib/search";

export interface IndexedProduct extends SearchDoc {
  slug: string;
  price: number;
  image: string;
}
export interface SearchIndex {
  products: IndexedProduct[];
  categories: { slug: string; name: string }[];
}

let cached: Promise<SearchIndex> | null = null;

// Fetched once per visit, the first time it is needed.
export function loadSearchIndex(): Promise<SearchIndex> {
  if (!cached) {
    cached = fetch("/search-index.json")
      .then((r) => r.json())
      .then((j: { categories: [string, string][]; products: [string, string, number, string, string][] }) => ({
        categories: j.categories.map(([slug, name]) => ({ slug, name })),
        products: j.products.map(([slug, name, price, category, image]) => ({ slug, name, price, category, image })),
      }))
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

const RECENT_KEY = "cv_searches";
export function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
export function rememberSearch(q: string) {
  const t = q.trim();
  if (!t) return;
  try {
    const next = [t, ...getRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* storage blocked */ }
}
export function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
}
