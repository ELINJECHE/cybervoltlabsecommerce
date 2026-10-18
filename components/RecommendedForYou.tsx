"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKES } from "@/lib/format";
import { hasSignals, readSignals, recommend } from "@/lib/personal";
import { loadSearchIndex, type IndexedProduct } from "@/lib/search-index";

// Picks based on what this visitor has viewed, saved or added to the cart. Invisible until there
// is something to go on; nothing is sent anywhere.
export default function RecommendedForYou({ title = "Recommended for you", subtitle = "Based on what you've looked at" }: {
  title?: string; subtitle?: string;
}) {
  const [items, setItems] = useState<IndexedProduct[]>([]);

  useEffect(() => {
    const signals = readSignals();
    if (!hasSignals(signals)) return;
    loadSearchIndex()
      .then((idx) => setItems(recommend(idx.products, signals)))
      .catch(() => undefined);
  }, []);

  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-3">
      <div className="mb-3">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        <p className="text-xs text-muted sm:text-sm">{subtitle}</p>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto scrollbar-hide pb-2">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="flex w-40 shrink-0 snap-start flex-col rounded-card border border-border bg-surface shadow-card hover:shadow-md sm:w-48"
          >
            <span className="relative block aspect-square overflow-hidden rounded-t-card bg-primary-light">
              <Image src={p.image} alt={p.name} fill sizes="192px" className="object-cover" />
            </span>
            <span className="flex flex-1 flex-col gap-1 p-3">
              <span className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</span>
              <span className="text-sm font-bold">{formatKES(p.price)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
