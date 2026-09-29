"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import ShowMoreGrid from "@/components/ShowMoreGrid";

export default function SearchResultsClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subcategory ?? "").toLowerCase().includes(query)
    );
  }, [products, query]);

  if (!query) {
    return (
      <div>
        <p className="mb-4 text-sm text-muted">Browsing all {products.length} products</p>
        <ShowMoreGrid products={results} />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>
      {results.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No products found. Try a different search, or ask us on WhatsApp.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {results.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
