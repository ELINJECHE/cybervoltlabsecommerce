"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { filterProducts, getAllColors } from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";
import FilterPanel, { type SelectedFilters } from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SortSelect, { sortProducts, type SortKey } from "@/components/SortSelect";
import ReviewsCarousel from "@/components/ReviewsCarousel";

export default function CategoryPageClient({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const searchParams = useSearchParams();
  const initialSub = searchParams.get("sub");

  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => p.discountPrice ?? p.price), 1000),
    [products]
  );
  const colors = useMemo(() => getAllColors(products), [products]);

  const [selected, setSelected] = useState<SelectedFilters>({
    subcategories: initialSub ? [initialSub] : [],
    colors: [],
    priceMax: maxPrice,
  });

  const [sort, setSort] = useState<SortKey>("relevance");
  const [visible, setVisible] = useState(24);

  const filtered = useMemo(() => {
    let result = filterProducts(products, {
      colors: selected.colors.length > 0 ? selected.colors : undefined,
      maxPrice: selected.priceMax,
    });
    if (selected.subcategories.length > 0) {
      result = result.filter((p) => p.subcategory && selected.subcategories.includes(p.subcategory));
    }
    return sort === "relevance" ? result : sortProducts(result, sort);
  }, [products, selected, sort]);

  return (
    <div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <FilterPanel
          subcategories={category.subcategories}
          colors={colors}
          maxPrice={maxPrice}
          selected={selected}
          onChange={setSelected}
          onClear={() => setSelected({ subcategories: [], colors: [], priceMax: maxPrice })}
          resultCount={filtered.length}
        />

        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{filtered.length} results</p>
            <SortSelect value={sort} onChange={(v) => { setSort(v); setVisible(24); }} />
          </div>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No products match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {filtered.slice(0, visible).map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          )}
          {filtered.length > visible && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 24)}
                className="tap-target rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
              >
                Show more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </div>
      </div>

      <ReviewsCarousel reviews={getAllReviews()} />
    </div>
  );
}
