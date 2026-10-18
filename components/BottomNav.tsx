"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { BOTTOM_NAV_ENABLED } from "@/lib/community";

const ICON = "h-6 w-6";
const ITEMS = [
  { href: "/", label: "Home", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
  { href: "/categories", label: "Categories", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
  { href: "/search", label: "Search", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" /> },
  { href: "/cart", label: "Cart", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01" /> },
  { href: "/account", label: "Account", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.8 7.5a3.8 3.8 0 1 1-7.6 0 3.8 3.8 0 0 1 7.6 0ZM4.5 20.5a7.5 7.5 0 0 1 15 0" /> },
];

// App-style bar on phones. Turn it off with BOTTOM_NAV_ENABLED in lib/community.ts.
export default function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  if (!BOTTOM_NAV_ENABLED) return null;
  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null;

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={ICON}>{item.icon}</svg>
                {item.label}
                {item.href === "/cart" && itemCount > 0 && (
                  <span className="absolute right-[26%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
