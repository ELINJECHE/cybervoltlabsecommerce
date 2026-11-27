"use client";

import { useState } from "react";
import type { FacetGroup, FilterAvailability, SelectedFilters } from "@/lib/facets";

interface FilterPanelProps {
  groups: FacetGroup[];
  avail: FilterAvailability;
  bands: { label: string; min: number; max: number }[];
  selected: SelectedFilters;
  onChange: (next: SelectedFilters) => void;
  onClear: () => void;
  resultCount: number;
}

const SHOWN_AT_FIRST = 6;

export default function FilterPanel({ groups, avail, bands, selected, onChange, onClear, resultCount }: FilterPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleValue(label: string, value: string) {
    const current = selected.facets[label] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...selected, facets: { ...selected.facets, [label]: next } });
  }

  const priceMaxShown = selected.priceMax >= avail.maxPrice ? "" : String(selected.priceMax);
  const priceMinShown = selected.priceMin <= 0 ? "" : String(selected.priceMin);
  const toggles: { key: "inStock" | "onSale" | "newOnly" | "dealsOnly"; label: string; show: boolean }[] = [
    { key: "inStock", label: "In stock only", show: avail.anySoldOut },
    { key: "onSale", label: "On sale", show: avail.anyOnSale },
    { key: "newOnly", label: "New arrivals", show: avail.anyNew },
    { key: "dealsOnly", label: "Deals", show: avail.anyDeal },
  ];

  const fields = (
    <div className="flex flex-col gap-5">
      {toggles.some((t) => t.show) && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Show only</legend>
          <div className="flex flex-col gap-1">
            {toggles.filter((t) => t.show).map((t) => (
              <label key={t.key} className="tap-target flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected[t.key]} onChange={() => onChange({ ...selected, [t.key]: !selected[t.key] })} className="h-4 w-4 accent-primary" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price (KES)</legend>
        <div className="flex items-center gap-2">
          <input
            type="number" inputMode="numeric" min={0} placeholder="Min" aria-label="Minimum price" value={priceMinShown}
            onChange={(e) => onChange({ ...selected, priceMin: Math.max(0, Number(e.target.value) || 0) })}
            className="w-full min-w-0 rounded-md border border-border px-2 py-1.5 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number" inputMode="numeric" min={0} placeholder="Max" aria-label="Maximum price" value={priceMaxShown}
            onChange={(e) => onChange({ ...selected, priceMax: e.target.value === "" ? avail.maxPrice : Math.max(0, Number(e.target.value) || 0) })}
            className="w-full min-w-0 rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        {bands.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bands.map((b) => {
              const active = selected.priceMin === b.min && (selected.priceMax === b.max || (b.max > avail.maxPrice && selected.priceMax >= avail.maxPrice));
              return (
                <button
                  key={b.label} type="button" aria-pressed={active}
                  onClick={() => onChange({ ...selected, priceMin: active ? 0 : b.min, priceMax: active ? avail.maxPrice : Math.min(b.max, avail.maxPrice) })}
                  className={`rounded-full border px-2.5 py-1 text-xs ${active ? "border-primary bg-primary-light font-semibold text-primary" : "border-border"}`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      {avail.anyRated && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Customer rating</legend>
          <div className="flex flex-col gap-1">
            {[4, 3].map((r) => (
              <label key={r} className="tap-target flex items-center gap-2 text-sm">
                <input type="radio" name="min-rating" checked={selected.minRating === r} onChange={() => onChange({ ...selected, minRating: r })} className="h-4 w-4 accent-primary" />
                {r}★ &amp; up
              </label>
            ))}
            {selected.minRating > 0 && (
              <button type="button" onClick={() => onChange({ ...selected, minRating: 0 })} className="self-start text-xs text-primary hover:underline">Any rating</button>
            )}
          </div>
        </fieldset>
      )}

      {groups.map((group, i) => {
        const chosen = selected.facets[group.label] ?? [];
        const open = expanded[group.label];
        // Options the shopper ticked always stay visible, even when the list is collapsed.
        const visible = open ? group.options : group.options.filter((o, idx) => idx < SHOWN_AT_FIRST || chosen.includes(o.value));
        return (
          <details key={group.label} open={i < 3 || chosen.length > 0} className="group">
            <summary className="tap-target flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
              <span>{group.label}{chosen.length > 0 && <span className="ml-1 text-xs font-normal text-primary">({chosen.length})</span>}</span>
              <span aria-hidden className="text-muted transition group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-1 flex flex-col gap-1">
              {visible.map((o) => (
                <label key={o.value} className="tap-target flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={chosen.includes(o.value)} onChange={() => toggleValue(group.label, o.value)} className="h-4 w-4 accent-primary" />
                  <span className="flex-1">{o.value}</span>
                  <span className="text-xs text-muted">{o.count}</span>
                </label>
              ))}
              {group.options.length > visible.length || (open && group.options.length > SHOWN_AT_FIRST) ? (
                <button type="button" onClick={() => setExpanded({ ...expanded, [group.label]: !open })} className="self-start py-1 text-xs font-medium text-primary hover:underline">
                  {open ? "Show fewer" : `Show all ${group.options.length}`}
                </button>
              ) : null}
            </div>
          </details>
        );
      })}

      <button type="button" onClick={onClear} className="tap-target self-start text-sm font-medium text-primary hover:underline">
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
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
        <div className="fixed inset-0 z-[55] lg:hidden">
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
