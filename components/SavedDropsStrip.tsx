"use client";

import Link from "next/link";
import { formatKES } from "@/lib/format";
import { useSavedPrices } from "@/lib/use-saved-prices";

// Homepage nudge when something the visitor saved has got cheaper.
export default function SavedDropsStrip() {
  const drops = useSavedPrices().filter((s) => s.change > 0);
  if (drops.length === 0) return null;
  const top = [...drops].sort((a, b) => b.change - a.change)[0];
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <Link href="/wishlist" className="flex items-center gap-3 rounded-card border border-success/40 bg-success/10 p-3 text-sm hover:bg-success/15">
        <span className="text-xl" aria-hidden="true">🔔</span>
        <span>
          <strong>{drops.length === 1 ? "An item you saved is now cheaper" : `${drops.length} items you saved are now cheaper`}</strong>
          <span className="block text-xs text-muted">{top.item.name}: down {formatKES(top.change)} to {formatKES(top.now ?? 0)}</span>
        </span>
        <span className="ml-auto font-semibold text-primary">View →</span>
      </Link>
    </section>
  );
}
