"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchDocs, normalize } from "@/lib/search";
import {
  clearRecentSearches,
  getRecentSearches,
  loadSearchIndex,
  rememberSearch,
  type SearchIndex,
} from "@/lib/search-index";
import { formatKES } from "@/lib/format";

const TRENDING = ["gloves", "helmet", "riding jacket", "sneakers", "microwave", "duvet", "speaker"];

export default function SearchBar({
  initialQuery = "",
  className = "",
}: {
  initialQuery?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  // Load the catalogue file the first time the box is used.
  function openPanel() {
    setOpen(true);
    setRecent(getRecentSearches());
    if (!index) loadSearchIndex().then(setIndex).catch(() => undefined);
  }

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
      else if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);

  const trimmed = query.trim();
  const products = useMemo(() => (index && trimmed ? searchDocs(index.products, trimmed, 6) : []), [index, trimmed]);
  const categories = useMemo(() => {
    if (!index || !trimmed) return [];
    const q = normalize(trimmed);
    return index.categories.filter((c) => normalize(c.name).includes(q) || q.includes(normalize(c.name).split(" ")[0])).slice(0, 2);
  }, [index, trimmed]);

  // One flat list so the arrow keys can walk through everything.
  const rows: { key: string; href: string; run?: () => void }[] = [
    ...categories.map((c) => ({ key: `c-${c.slug}`, href: `/category/${c.slug}` })),
    ...products.map((p) => ({ key: `p-${p.slug}`, href: `/product/${p.slug}` })),
    ...(trimmed ? [{ key: "all", href: `/search?q=${encodeURIComponent(trimmed)}` }] : []),
  ];

  function go(href: string) {
    if (trimmed) rememberSearch(trimmed);
    setOpen(false);
    router.push(href);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && rows[active]) return go(rows[active].href);
    go(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
  }

  const cls = (i: number) => `flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary-light ${active === i ? "bg-primary-light" : ""}`;

  return (
    <form onSubmit={handleSubmit} className={`flex w-full items-center gap-2 ${className}`}>
      <div className="relative flex-1" ref={boxRef}>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(-1); if (!open) openPanel(); }}
          onFocus={openPanel}
          onKeyDown={onKeyDown}
          autoComplete="off"
          placeholder="Search gloves, helmets, sneakers, duvets..."
          aria-label="Search products"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          className="h-11 w-full rounded-full border border-border bg-surface pl-4 pr-10 text-sm outline-none focus:border-primary"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        {open && (
          <div id="search-suggestions" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-auto rounded-card border border-border bg-surface shadow-lg">
            {!trimmed ? (
              <div className="p-3 text-sm">
                {recent.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-semibold">Recent searches</p>
                      <button type="button" onClick={() => { clearRecentSearches(); setRecent([]); }} className="text-xs text-muted hover:text-primary">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((r) => (
                        <button key={r} type="button" onClick={() => go(`/search?q=${encodeURIComponent(r)}`)} className="rounded-full border border-border px-3 py-1 hover:bg-primary-light">🕘 {r}</button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mb-1 font-semibold">Popular right now</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button key={t} type="button" onClick={() => go(`/search?q=${encodeURIComponent(t)}`)} className="rounded-full border border-border px-3 py-1 hover:bg-primary-light">🔥 {t}</button>
                  ))}
                </div>
              </div>
            ) : !index ? (
              <p className="p-3 text-sm text-muted">Searching…</p>
            ) : (
              <ul>
                {categories.map((c, i) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} onClick={() => go(`/category/${c.slug}`)} className={cls(i)}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-lg" aria-hidden="true">🗂️</span>
                      <span>Browse <strong>{c.name}</strong></span>
                    </Link>
                  </li>
                ))}
                {products.map((p, i) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} onClick={(e) => { e.preventDefault(); go(`/product/${p.slug}`); }} className={cls(categories.length + i)}>
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-primary-light">
                        <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1">{p.name}</span>
                        <span className="text-xs font-semibold text-primary">{formatKES(p.price)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {products.length === 0 && categories.length === 0 && (
                  <li className="px-3 py-3 text-sm text-muted">No close matches for &ldquo;{trimmed}&rdquo;. Try another word, or ask us on WhatsApp.</li>
                )}
                <li>
                  <Link
                    href={`/search?q=${encodeURIComponent(trimmed)}`}
                    onClick={(e) => { e.preventDefault(); go(`/search?q=${encodeURIComponent(trimmed)}`); }}
                    className={`${cls(rows.length - 1)} border-t border-border font-semibold text-primary`}
                  >
                    See all results for &ldquo;{trimmed}&rdquo; →
                  </Link>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="tap-target h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
}
