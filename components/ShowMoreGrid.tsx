"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

const PAGE_SIZE = 8;

export default function ShowMoreGrid({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(Math.min(PAGE_SIZE, products.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < products.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(v + PAGE_SIZE, products.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, products.length]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {products.slice(0, visibleCount).map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => Math.min(v + PAGE_SIZE, products.length))}
            className="tap-target rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-light"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
