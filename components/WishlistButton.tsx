"use client";

import { useWishlist, type SavedItem } from "@/lib/wishlist";
import { showToast } from "@/lib/toast";

// The heart. "card" floats over a product photo; "inline" sits beside text on the product page.
export default function WishlistButton({ item, variant = "card" }: { item: SavedItem; variant?: "card" | "inline" }) {
  const { has, toggle } = useWishlist();
  const saved = has(item.slug);

  const heart = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill={saved ? "currentColor" : "none"} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );

  const onClick = () => {
    toggle(item);
    showToast(saved ? "Removed from saved" : "Saved ♥", saved ? undefined : "/wishlist", saved ? undefined : "View saved");
  };

  if (variant === "inline") {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} className={`tap-target inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${saved ? "border-deal text-deal" : "border-border text-muted hover:text-deal"}`}>
        {heart} {saved ? "Saved" : "Save for later"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
      className={`absolute right-2 top-[3.25rem] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white ${saved ? "text-deal" : "text-foreground/70"}`}
    >
      {heart}
    </button>
  );
}
