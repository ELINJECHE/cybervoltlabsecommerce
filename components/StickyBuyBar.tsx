"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatKES } from "@/lib/format";
import { showAddedToCart } from "@/lib/toast";

// Phones only: once the main Add to Cart button scrolls out of view, a slim bar keeps it in reach.
export default function StickyBuyBar({ productId, slug, name, image, price, needsChoice, soldOut = false }: {
  productId: string; slug: string; name: string; image: string; price: number;
  soldOut?: boolean;
  /** Colours to pick, or a size to note: send the visitor back up to the options instead. */
  needsChoice: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const { addItem } = useCart();
  const barRef = useRef<HTMLDivElement>(null);

  // Show the bar once the main buttons have scrolled up out of sight.
  useEffect(() => {
    const target = document.getElementById("buy-actions");
    if (!target) return;
    const check = () => setVisible(target.getBoundingClientRect().bottom < 0);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Publish the bar's height so the floating Nami button and the cookie notice sit above it (see globals.css).
  const showing = visible && !soldOut;
  useEffect(() => {
    const root = document.documentElement;
    const el = barRef.current;
    if (!showing || !el) { root.style.setProperty("--cv-sticky-h", "0px"); return; }
    const publish = () => root.style.setProperty("--cv-sticky-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.setProperty("--cv-sticky-h", "0px"); };
  }, [showing]);

  if (!showing) return null;
  return (
    <div
      ref={barRef}
      style={{ bottom: "calc(var(--cv-nav-h) + env(safe-area-inset-bottom, 0px))" }}
      className="fixed inset-x-0 z-30 border-t border-border bg-surface px-4 py-2 shadow-lg lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{name}</p>
          <p className="text-base font-bold">{formatKES(price)}</p>
        </div>
        {needsChoice ? (
          <button
            type="button"
            onClick={() => document.getElementById("buy-actions")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="tap-target rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            Choose options
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { addItem({ productId, slug, name, image, unitPrice: price }); showAddedToCart({ name, image }); }}
            className="tap-target rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
