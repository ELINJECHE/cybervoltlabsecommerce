"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { getStoreReviews } from "@/lib/reviews";
import { applyFilters, availability, buildFacetGroups, emptyFilters, priceBands, type SelectedFilters } from "@/lib/facets";
import FilterPanel from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
import SortSelect, { sortProducts, type SortKey } from "@/components/SortSelect";
import ReviewsCarousel from "@/components/ReviewsCarousel";

export default function CategoryPageClient({
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const searchParams = useSearchParams();
  const initialSub = searchParams.get("sub");

  const groups = useMemo(() => buildFacetGroups(products), [products]);
  const avail = useMemo(() => availability(products), [products]);
  const bands = useMemo(() => priceBands(products), [products]);

  const [selected, setSelected] = useState<SelectedFilters>(() => {
    const base = emptyFilters(availability(products));
    // ?sub=<subcategory slug> (from the menu) pre-ticks that Type.
    if (initialSub) base.facets = { Type: [initialSub.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())] };
    return base;
  });

  const [sort, setSort] = useState<SortKey>("relevance");
  const [visible, setVisible] = useState(24);

  const filtered = useMemo(() => {
    const result = applyFilters(products, selected);
    return sort === "relevance" ? result : sortProducts(result, sort);
  }, [products, selected, sort]);

  // One removable chip per active filter, so shoppers can see and undo what is narrowing the list.
  const chips: { key: string; label: string; remove: () => void }[] = [];
  for (const [label, values] of Object.entries(selected.facets)) {
    for (const v of values) {
      chips.push({
        key: `${label}:${v}`,
        label: v,
        remove: () => setSelected((s) => ({ ...s, facets: { ...s.facets, [label]: (s.facets[label] ?? []).filter((x) => x !== v) } })),
      });
    }
  }
  if (selected.priceMin > 0 || selected.priceMax < avail.maxPrice) {
    const lo = selected.priceMin.toLocaleString();
    const hi = selected.priceMax.toLocaleString();
    const label = selected.priceMax >= avail.maxPrice ? `KES ${lo}+` : selected.priceMin > 0 ? `KES ${lo} – ${hi}` : `Up to KES ${hi}`;
    chips.push({
      key: "price",
      label,
      remove: () => setSelected((s) => ({ ...s, priceMin: 0, priceMax: avail.maxPrice })),
    });
  }
  const flags: [keyof SelectedFilters, string][] = [["inStock", "In stock"], ["onSale", "On sale"], ["newOnly", "New arrivals"], ["dealsOnly", "Deals"]];
  for (const [key, label] of flags) if (selected[key]) chips.push({ key, label, remove: () => setSelected((s) => ({ ...s, [key]: false })) });
  if (selected.minRating > 0) chips.push({ key: "rating", label: `${selected.minRating}★ & up`, remove: () => setSelected((s) => ({ ...s, minRating: 0 })) });

  const clearAll = () => setSelected(emptyFilters(avail));

  return (
    <div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <FilterPanel
          groups={groups}
          avail={avail}
          bands={bands}
          selected={selected}
          onChange={setSelected}
          onClear={clearAll}
          resultCount={filtered.length}
        />

        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{filtered.length} results</p>
            <SortSelect value={sort} onChange={(v) => { setSort(v); setVisible(24); }} />
          </div>
          {chips.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.key} type="button" onClick={c.remove} className="flex items-center gap-1 rounded-full border border-primary bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                  {c.label} <span aria-hidden>×</span><span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button type="button" onClick={clearAll} className="text-xs font-medium text-muted underline">Clear all</button>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              <p>No products match these filters.</p>
              <button type="button" onClick={clearAll} className="mt-2 font-medium text-primary underline">Clear all filters</button>
            </div>
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

      <ReviewsCarousel reviews={getStoreReviews()} />
    </div>
  );
}
