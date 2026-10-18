"use client";

import { useEffect, useState } from "react";
import { loadSearchIndex } from "@/lib/search-index";
import { useWishlist, type SavedItem } from "@/lib/wishlist";

export interface SavedPrice {
  item: SavedItem;
  /** Today's price, or null when the product is no longer in the shop. */
  now: number | null;
  /** Positive when it got cheaper since it was saved, negative when it went up. */
  change: number;
}

// Compares each saved item's price (when it was saved) with today's price. No server involved:
// it runs when the visitor comes back.
export function useSavedPrices(): SavedPrice[] {
  const { items } = useWishlist();
  const [now, setNow] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    loadSearchIndex()
      .then((idx) => {
        setNow(Object.fromEntries(idx.products.map((p) => [p.slug, p.price])));
        setLoaded(true);
      })
      .catch(() => undefined);
  }, [items.length]);

  if (!loaded) return [];
  return items.map((item) => {
    const price = now[item.slug];
    return { item, now: price ?? null, change: price === undefined ? 0 : item.price - price };
  });
}
