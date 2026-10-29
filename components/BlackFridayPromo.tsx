"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BLACK_FRIDAY_THEME, bfPhase } from "@/lib/blackfriday";

const KEY = "cv_bf_promo_closed";

// Small dismissible card at the bottom-left on larger screens (like Jumia's), pointing to the deals page.
// Not shown on phones (the bottom menu and WhatsApp button live there), on the deals page, or at checkout.
export default function BlackFridayPromo() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (!BLACK_FRIDAY_THEME || bfPhase() === "ended") return;
    try { if (localStorage.getItem(KEY)) return; } catch { /* storage blocked: still show once */ }
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!open || path.startsWith("/black-friday") || path.startsWith("/checkout") || path.startsWith("/admin")) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden w-64 overflow-hidden rounded-card bg-[#07070d] p-4 text-white shadow-card lg:block">
      <button type="button" aria-label="Close" onClick={() => { setOpen(false); try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } }}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm hover:bg-white/40">×</button>
      <p className="text-xs font-black tracking-widest text-[#ffc83d]">BLACK FRIDAY</p>
      <p className="mt-1 text-lg font-black leading-tight">Biggest offers ready to drop</p>
      <p className="mt-1 text-xs text-white/75">Real price cuts, same-day delivery in Nairobi.</p>
      <Link href="/black-friday" className="mt-3 inline-block rounded-full bg-[#5de7a4] px-4 py-1.5 text-sm font-black text-[#07070d] hover:opacity-90">See the deals →</Link>
    </div>
  );
}
