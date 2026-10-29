"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { currentWeek } from "@/lib/blackfriday";
import { percentOff } from "@/lib/format";

// Every product with a real price cut, biggest saving first (this week's featured categories lead), with category
// pills like Jumia's. The "old price" shown is the shop's own normal price, never an invented one.
export default function BlackFridayDealGrid({ products, categories }: { products: Product[]; categories: { slug: string; name: string }[] }) {
  const [cat, setCat] = useState("all");
  const [lead, setLead] = useState<string[]>([]);
  useEffect(() => setLead(currentWeek()?.categories ?? []), []);

  const shown = useMemo(() => {
    const list = products.filter((p) => cat === "all" || p.category === cat);
    const pct = (p: Product) => percentOff(p.price, p.discountPrice ?? p.price);
    return [...list].sort((a, b) => Number(lead.includes(b.category)) - Number(lead.includes(a.category)) || pct(b) - pct(a));
  }, [products, cat, lead]);

  const present = categories.filter((c) => products.some((p) => p.category === c.slug));
  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[{ slug: "all", name: "All deals" }, ...present].map((c) => (
          <button key={c.slug} type="button" onClick={() => setCat(c.slug)}
            className={`tap-target shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${cat === c.slug ? "border-[#07070d] bg-[#07070d] text-white" : "border-border bg-surface hover:border-primary"}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
      </div>
    </div>
  );
}
