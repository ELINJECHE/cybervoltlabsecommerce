"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatKES } from "@/lib/format";
import { showToast } from "@/lib/toast";

export interface SetItem { id: string; slug: string; name: string; image: string; price: number }

// "Complete your set": tick what you want and add it all in one tap.
export default function CompleteTheSet({ current, picks }: { current: SetItem | null; picks: SetItem[] }) {
  const items = [...(current ? [current] : []), ...picks];
  const [chosen, setChosen] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const { addItem } = useCart();
  if (picks.length === 0) return null;

  const selected = items.filter((i) => chosen.has(i.id));
  const total = selected.reduce((sum, i) => sum + i.price, 0);
  const toggle = (id: string) => setChosen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8">
      <h2 className="mb-3 text-lg font-bold">Complete your set</h2>
      <div className="rounded-card border border-border bg-surface p-3 sm:p-4">
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input type="checkbox" checked={chosen.has(item.id)} onChange={() => toggle(item.id)} aria-label={`Include ${item.name}`} className="h-5 w-5 accent-[var(--color-primary)]" />
              <Link href={`/product/${item.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-primary-light">
                <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
              </Link>
              <Link href={`/product/${item.slug}`} className="min-w-0 flex-1 text-sm hover:text-primary">
                <span className="line-clamp-2">{item.name}{item === current ? " (this item)" : ""}</span>
              </Link>
              <span className="shrink-0 text-sm font-semibold">{formatKES(item.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-sm">{selected.length} selected · <span className="font-bold">{formatKES(total)}</span></p>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              selected.forEach((i) => addItem({ productId: i.id, slug: i.slug, name: i.name, image: i.image, unitPrice: i.price }));
              showToast(`${selected.length} item${selected.length === 1 ? "" : "s"} added ✓`, "/cart", "View cart");
            }}
            className="tap-target rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
          >
            Add selected to cart
          </button>
        </div>
      </div>
    </section>
  );
}
