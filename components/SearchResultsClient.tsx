"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import ShowMoreGrid from "@/components/ShowMoreGrid";
import SortSelect, { sortProducts, type SortKey } from "@/components/SortSelect";
import { searchDocs } from "@/lib/search";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function SearchResultsClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const [sort, setSort] = useState<SortKey>("relevance");

  const results = useMemo(() => {
    if (!query) return products;
    const found = searchDocs(products, query);
    return sort === "relevance" ? found : sortProducts(found, sort);
  }, [products, query, sort]);

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
        </p>
        {results.length > 1 && <SortSelect value={sort} onChange={setSort} withRelevance />}
      </div>
      {results.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">
          <p>Nothing matched &ldquo;{query}&rdquo;. Check the spelling, or tell us what you&rsquo;re after:</p>
          <a
            href={buildWhatsAppLink(`Hi Cybervolt Labs, I'm looking for: ${query}. Do you have it?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target mt-4 inline-flex items-center rounded-full bg-whatsapp px-6 py-3 font-semibold text-white hover:brightness-95"
          >
            💬 Ask us on WhatsApp
          </a>
        </div>
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
