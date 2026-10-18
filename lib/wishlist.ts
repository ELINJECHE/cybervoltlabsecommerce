"use client";

import { useCallback, useEffect, useState } from "react";

// Saved products ("heart"), kept in the browser with just enough detail to show them again.
export interface SavedItem { slug: string; name: string; price: number; image: string; id?: string }

const KEY = "cv_wishlist";
const EVENT = "cv-wishlist-change";

function read(): SavedItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function useWishlist() {
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const write = useCallback((next: SavedItem[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    setItems(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback((item: SavedItem) => {
    const cur = read();
    write(cur.some((i) => i.slug === item.slug) ? cur.filter((i) => i.slug !== item.slug) : [item, ...cur].slice(0, 60));
  }, [write]);

  const remove = useCallback((slug: string) => write(read().filter((i) => i.slug !== slug)), [write]);

  return { items, has: (slug: string) => items.some((i) => i.slug === slug), toggle, remove };
}
