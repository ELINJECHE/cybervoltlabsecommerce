"use client";

import { useSyncExternalStore } from "react";

// The product the visitor is looking at, so the floating Nami button can open the same chat
// (same pre-filled message) as Nami's greeting card on the product page.
export interface ChatProduct { name: string; slug: string }

let current: ChatProduct | null = null;
const listeners = new Set<() => void>();

export function setChatProduct(p: ChatProduct | null) {
  current = p;
  listeners.forEach((l) => l());
}

export function useChatProduct(): ChatProduct | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => current,
    () => null,
  );
}

// The page address for the pre-filled message (only known in the browser).
export function currentPageUrl(): string | undefined {
  return typeof window === "undefined" ? undefined : window.location.href;
}
