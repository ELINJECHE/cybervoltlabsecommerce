"use client";

import { useState } from "react";
import type { Subcategory } from "@/lib/types";

export interface SelectedFilters {
  subcategories: string[];
  colors: string[];
  priceMax: number;
}

interface FilterPanelProps {
  subcategories: Subcategory[];
  colors: string[];
  maxPrice: number;
  selected: SelectedFilters;
  onChange: (next: SelectedFilters) => void;
  onClear: () => void;
  resultCount: number;
}

export default function FilterPanel({
  subcategories,
  colors,
  maxPrice,
  selected,
  onChange,
  onClear,
  resultCount,
}: FilterPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  function toggleSubcategory(slug: string) {
    const next = selected.subcategories.includes(slug)
      ? selected.subcategories.filter((s) => s !== slug)
      : [...selected.subcategories, slug];
    onChange({ ...selected, subcategories: next });
  }

  function toggleColor(name: string) {
    const next = selected.colors.includes(name)
      ? selected.colors.filter((c) => c !== name)
      : [...selected.colors, name];
    onChange({ ...selected, colors: next });
  }

  const fields = (
    <div className="flex flex-col gap-6">
      {subcategories.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Subcategory</legend>
          <div className="flex flex-col gap-2">
            {subcategories.map((sub) => (
              <label key={sub.slug} className="tap-target flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.subcategories.includes(sub.slug)}
                  onChange={() => toggleSubcategory(sub.slug)}
                  className="h-4 w-4 accent-primary"
                />
                {sub.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Max Price</legend>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={500}
          value={selected.priceMax}
          onChange={(e) => onChange({ ...selected, priceMax: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted">Up to KES {selected.priceMax.toLocaleString()}</p>
      </fieldset>

      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Color</legend>
          <div className="flex flex-col gap-2">
            {colors.map((color) => (
              <label key={color} className="tap-target flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.colors.includes(color)}
                  onChange={() => toggleColor(color)}
                  className="h-4 w-4 accent-primary"
                />
                {color}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={onClear}
        className="tap-target self-start text-sm font-medium text-primary hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Filters</h2>
        {fields}
      </aside>

      {/* Mobile trigger + bottom sheet */}
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="tap-target flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m9 12h3.75M16.5 18a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0H13.5m-9.75-6H9.75m0 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0m3.75 0H20.25" />
          </svg>
          Filters
        </button>
        <span className="text-xs text-muted">{resultCount} results</span>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close filters" className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] animate-slide-up overflow-y-auto rounded-t-2xl bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="tap-target flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {fields}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="tap-target mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white"
            >
              Show {resultCount} results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
