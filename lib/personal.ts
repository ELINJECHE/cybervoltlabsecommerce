"use client";

import type { IndexedProduct } from "@/lib/search-index";

// What a visitor has looked at, saved and put in their cart, read from this browser only.
export interface Signals {
  recent: string[];
  saved: { slug: string; price: number }[];
  cart: string[];
}

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}

export function readSignals(): Signals {
  return {
    recent: read<{ slug: string }>("cv_recent").map((i) => i.slug),
    saved: read<{ slug: string; price: number }>("cv_wishlist").map((i) => ({ slug: i.slug, price: i.price })),
    cart: read<{ slug: string }>("cybervolt-cart").map((i) => i.slug),
  };
}

export function hasSignals(s: Signals): boolean {
  return s.recent.length + s.saved.length + s.cart.length > 0;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// Products in the categories the visitor keeps returning to, near the prices they look at.
// Cart items count most, then saved items, then pages viewed.
export function recommend(index: IndexedProduct[], s: Signals, limit = 8): IndexedProduct[] {
  const bySlug = new Map(index.map((p) => [p.slug, p]));
  const weight = new Map<string, number>();
  const prices: number[] = [];
  const add = (slug: string, w: number) => {
    const p = bySlug.get(slug);
    if (!p) return;
    weight.set(p.category, (weight.get(p.category) ?? 0) + w);
    prices.push(p.price);
  };
  s.cart.forEach((slug) => add(slug, 4));
  s.saved.forEach((i) => add(i.slug, 3));
  s.recent.forEach((slug) => add(slug, 2));
  if (weight.size === 0) return [];

  const seen = new Set([...s.cart, ...s.recent, ...s.saved.map((i) => i.slug)]);
  const anchor = median(prices) || 1;
  const scored = index
    .filter((p) => !seen.has(p.slug) && weight.has(p.category) && p.price > 0)
    .map((p) => ({ p, score: (weight.get(p.category) ?? 0) * 10 - Math.abs(Math.log(p.price / anchor)) * 4 }))
    .sort((a, b) => b.score - a.score);

  // No more than five from one category, so a single interest doesn't fill the row.
  const perCat = new Map<string, number>();
  const out: IndexedProduct[] = [];
  for (const { p } of scored) {
    const n = perCat.get(p.category) ?? 0;
    if (n >= 5) continue;
    perCat.set(p.category, n + 1);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
