import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

// One horizontally scrolling row of products with a title and a "See all" link.
export default function Shelf({
  title,
  subtitle,
  href,
  products,
  tint = false,
}: {
  title: string;
  subtitle?: string;
  href: string;
  products: Product[];
  tint?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-3">
      <div className={`rounded-card p-3 sm:p-4 ${tint ? "bg-primary-light" : ""}`}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted sm:text-sm">{subtitle}</p>}
          </div>
          <Link
            href={href}
            className="tap-target shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            See all →
          </Link>
        </div>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto scrollbar-hide px-1 pb-2">
          {products.map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
