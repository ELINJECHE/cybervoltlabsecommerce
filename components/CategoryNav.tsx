"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import SearchBar from "@/components/SearchBar";

export default function CategoryNav({ categories }: { categories: Category[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { itemCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();

  // The header has `backdrop-blur`, which — like `filter`/`transform` — makes
  // it a containing block for `position: fixed` descendants. Without a
  // portal, the drawer's `fixed inset-0` would size itself to the header
  // instead of the viewport.
  useEffect(() => setMounted(true), []);

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
            src="/assets/images/logo.svg"
            alt="Cybervolt Labs"
            width={375}
            height={375}
            priority
            className="h-11 w-11 sm:h-12 sm:w-12"
          />
        </Link>

        <div className="hidden flex-1 lg:block">
          <SearchBar />
        </div>

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
      <nav className="hidden border-t border-border lg:block">
        <ul className="mx-auto flex max-w-7xl gap-6 px-4">
          {categories.map((category) => (
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
