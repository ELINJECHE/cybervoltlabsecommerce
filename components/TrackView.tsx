"use client";

import { useEffect } from "react";
import { trackShop } from "@/lib/analytics";

export const RECENT_KEY = "cv_recent";
export interface RecentItem { slug: string; name: string; price: number; image: string }

// Remembers the products a visitor opened (newest first, up to 12) for the "Recently viewed" row.
export default function TrackView({ item }: { item: RecentItem }) {
  useEffect(() => {
    trackShop("view_item", [{ id: item.slug, name: item.name, price: item.price }]);
    try {
      const prev: RecentItem[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      const next = [item, ...prev.filter((p) => p.slug !== item.slug)].slice(0, 12);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* storage blocked: skip */ }
  }, [item]);
  return null;
}
