"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth-context";
import SearchBar from "@/components/SearchBar";

export default function CategoryNav({ categories }: { categories: Category[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { itemCount } = useCart();
  const { items: savedItems } = useWishlist();
  const { user } = useAuth();
  const pathname = usePathname();

  // The header has `backdrop-blur`, which — like `filter`/`transform` — makes
  // it a containing block for `position: fixed` descendants. Without a
  // portal, the drawer's `fixed inset-0` would size itself to the header
  // instead of the viewport.
  useEffect(() => setMounted(true), []);

  // Desktop row: show the categories that fit on one line, the rest go under "More".
  // A hidden copy of the row measures every label so the split can be recomputed on resize.
  const rowRef = useRef<HTMLUListElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [visibleCount, setVisibleCount] = useState(categories.length);
  const [moreOpen, setMoreOpen] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const fit = () => {
      const style = getComputedStyle(row);
      const available = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const gap = parseFloat(style.columnGap) || 0;
      const items = Array.from(measure.children) as HTMLElement[];
      const moreWidth = items[items.length - 1].offsetWidth;
      const widths = items.slice(0, -1).map((el) => el.offsetWidth);
      const total = widths.reduce((sum, w) => sum + w, 0) + gap * (widths.length - 1);
      if (total <= available) return setVisibleCount(widths.length);
      let used = moreWidth;
      let count = 0;
      while (count < widths.length && used + gap + widths[count] <= available) used += gap + widths[count++];
      setVisibleCount(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [categories]);

  const moreRef = useRef<HTMLLIElement>(null);
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [moreOpen]);

  const visible = categories.slice(0, visibleCount);
  const overflow = categories.slice(visibleCount);
  const overflowActive = overflow.some((c) => pathname === `/category/${c.slug}`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          className="tap-target -ml-2 flex items-center justify-center rounded-md text-foreground lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/assets/images/logo-128.png"
            alt="Cybervolt Labs"
            width={128}
            height={128}
            priority
            className="h-11 w-11 sm:h-12 sm:w-12"
          />
        </Link>

        <div className="hidden flex-1 lg:block">
          <SearchBar />
        </div>

        <Link href="/black-friday" className="hidden shrink-0 rounded-full bg-[#07070d] px-3 py-1.5 text-xs font-black tracking-wide text-[#ffc83d] hover:bg-black lg:inline-flex">
          BLACK FRIDAY
        </Link>

        <Link
          href="/account"
          aria-label={user ? "My Account" : "Log in or create an account"}
          className="tap-target ml-auto flex items-center justify-center rounded-md lg:ml-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Link>

        <Link
          href="/wishlist"
          aria-label={`Saved items, ${savedItems.length}`}
          className="tap-target relative hidden items-center justify-center rounded-md sm:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          {savedItems.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-deal px-1 text-[11px] font-bold text-white">
              {savedItems.length}
            </span>
          )}
        </Link>

        <Link
          href="/cart"
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          className="tap-target relative flex items-center justify-center rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.694 2.602-7.152.153-.615-.325-1.198-.959-1.198H5.25M7.5 14.25 5.106 5.272M7.5 14.25 5.25 5.272m0 0L4.5 3M6 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-deal px-1 text-[11px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      {/* Desktop category row with 2-level hover dropdown */}
      <nav className="relative hidden border-t border-border lg:block">
        <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
          <ul ref={measureRef} className="flex w-max gap-6 whitespace-nowrap px-4">
            {categories.map((category) => (
              <li key={category.slug} className="py-2.5 text-sm font-medium">{category.name}</li>
            ))}
            <li className="py-2.5 text-sm font-medium">More ▾</li>
          </ul>
        </div>
        <ul ref={rowRef} className="mx-auto flex max-w-7xl gap-6 whitespace-nowrap px-4">
          {visible.map((category) => (
            <li key={category.slug} className="group relative">
              <Link
                href={`/category/${category.slug}`}
                className={`inline-block py-2.5 text-sm font-medium transition hover:text-primary ${
                  pathname === `/category/${category.slug}` ? "text-primary" : ""
                }`}
              >
                {category.name}
              </Link>
              {category.subcategories.length > 0 && (
                <div className="absolute left-0 top-full z-50 hidden min-w-[180px] rounded-b-card border border-border bg-surface py-1 shadow-card group-hover:block">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/category/${category.slug}?sub=${sub.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-primary-light hover:text-primary"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
          {overflow.length > 0 && (
            <li
              ref={moreRef}
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                onClick={() => setMoreOpen(true)}
                className={`inline-block py-2.5 text-sm font-medium transition hover:text-primary ${
                  overflowActive ? "text-primary" : ""
                }`}
              >
                More ▾
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full z-50 min-w-[220px] rounded-b-card border border-border bg-surface py-1 shadow-card">
                  {overflow.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className={`block px-4 py-2 text-sm hover:bg-primary-light hover:text-primary ${
                        pathname === `/category/${category.slug}` ? "text-primary" : ""
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* Mobile search row */}
      <div className="border-t border-border px-4 py-2 lg:hidden">
        <SearchBar />
      </div>

      {/* Mobile drawer, portaled to <body> so it isn't clipped by the header's containing block */}
      {mounted && mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-xs animate-slide-up overflow-y-auto bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold">Shop by Category</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="tap-target flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Link
              href="/black-friday"
              onClick={() => setMobileMenuOpen(false)}
              className="tap-target mb-2 flex items-center justify-between rounded-card bg-[#07070d] px-4 py-3 text-sm font-black text-white"
            >
              <span><span className="text-[#ffc83d]">BLACK FRIDAY</span> deals</span>
              <span aria-hidden="true">→</span>
            </Link>
            <ul className="flex flex-col">
              {categories.map((category) => {
                const isExpanded = expandedSlug === category.slug;
                return (
                  <li key={category.slug} className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/category/${category.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="tap-target flex flex-1 items-center py-3 text-sm font-medium"
                      >
                        {category.name}
                      </Link>
                      {category.subcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedSlug(isExpanded ? null : category.slug)}
                          aria-label={`Toggle ${category.name} subcategories`}
                          className="tap-target flex items-center justify-center px-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <ul className="pb-2 pl-4">
                        {category.subcategories.map((sub) => (
                          <li key={sub.slug}>
                            <Link
                              href={`/category/${category.slug}?sub=${sub.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="tap-target block py-2 text-sm text-muted"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
