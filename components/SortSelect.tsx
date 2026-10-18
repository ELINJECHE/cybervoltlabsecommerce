"use client";

import type { Product } from "@/lib/types";

export type SortKey = "relevance" | "price-asc" | "price-desc" | "photos";

const price = (p: Product) => p.discountPrice ?? p.price;

export function sortProducts(list: Product[], key: SortKey): Product[] {
  const copy = [...list];
  if (key === "price-asc") copy.sort((a, b) => price(a) - price(b));
  else if (key === "price-desc") copy.sort((a, b) => price(b) - price(a));
  else if (key === "photos") copy.sort((a, b) => b.images.length - a.images.length || price(b) - price(a));
  return copy;
}

export default function SortSelect({ value, onChange, withRelevance = false }: {
  value: SortKey; onChange: (v: SortKey) => void; withRelevance?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-primary"
      >
        <option value="relevance">{withRelevance ? "Best match" : "Featured"}</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="photos">Most photos</option>
      </select>
    </label>
  );
}
