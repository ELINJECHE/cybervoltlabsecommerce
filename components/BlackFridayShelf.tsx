import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { percentOff } from "@/lib/format";

// Products with a real price cut, in a dark container like Jumia's deal shelves. Shows nothing until some
// products have a discount price set (admin > Products), so it never promises deals that don't exist.
export function discounted(products: Product[]): Product[] {
  return products
    .filter((p) => p.discountPrice !== undefined && p.discountPrice < p.price)
    .sort((a, b) => percentOff(b.price, b.discountPrice!) - percentOff(a.price, a.discountPrice!));
}

// Biggest real discount in the shop right now (rounded down to a whole percent), 0 when there are none.
export function maxOff(products: Product[]): number {
  return discounted(products).reduce((m, p) => Math.max(m, percentOff(p.price, p.discountPrice!)), 0);
}

export default function BlackFridayShelf({ products, title = "Black Friday | Early Access Deals", limit = 12 }: { products: Product[]; title?: string; limit?: number }) {
  const deals = discounted(products).slice(0, limit);
  if (deals.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-3" aria-label={title}>
      <div className="rounded-card bg-[#1c1c28] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black leading-tight text-white sm:text-xl">{title}</h2>
          <Link href="/black-friday" className="tap-target shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#07070d] hover:bg-[#5de7a4]">See all →</Link>
        </div>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto scrollbar-hide px-1 pb-2">
          {deals.map((p) => (
            <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48"><ProductCard product={p} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
