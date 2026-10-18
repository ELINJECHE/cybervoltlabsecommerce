"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKES } from "@/lib/format";
import { RECENT_KEY, type RecentItem } from "@/components/TrackView";

// "Pick up where you left off": only shows once the visitor has opened a product.
export default function RecentlyViewed({ exclude }: { exclude?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    try {
      const all: RecentItem[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      setItems(all.filter((i) => i.slug !== exclude).slice(0, 8));
    } catch { /* ignore */ }
  }, [exclude]);

  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-3">
      <h2 className="mb-2 text-lg font-bold">Pick up where you left off</h2>
      <div className="flex snap-x gap-3 overflow-x-auto scrollbar-hide pb-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/product/${item.slug}`}
            className="flex w-56 shrink-0 snap-start items-center gap-3 rounded-card border border-border bg-surface p-2 hover:shadow-md"
          >
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-primary-light">
              <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-xs font-medium leading-snug">{item.name}</span>
              <span className="text-sm font-bold">{formatKES(item.price)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
