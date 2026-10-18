"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist";
import { formatKES } from "@/lib/format";
import { showToast } from "@/lib/toast";
import { useSavedPrices } from "@/lib/use-saved-prices";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();
  const prices = new Map(useSavedPrices().map((s) => [s.item.slug, s]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Saved for later</h1>
      <p className="mb-4 text-xs text-muted">Saved on this device only.</p>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">Nothing saved yet. Tap the heart on any product to keep it here.</p>
          <Link href="/" className="tap-target mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            Start browsing
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
              <Link href={`/product/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-primary-light">
                <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">{item.name}</Link>
                {(() => {
                  const sp = prices.get(item.slug);
                  if (!sp) return <p className="text-sm font-bold">{formatKES(item.price)}</p>;
                  if (sp.now === null) return <p className="text-xs text-muted">No longer listed</p>;
                  return (
                    <>
                      <p className="text-sm font-bold">{formatKES(sp.now)}</p>
                      {sp.change > 0 && <p className="text-xs font-semibold text-success">↓ {formatKES(sp.change)} cheaper than when you saved it</p>}
                      {sp.change < 0 && <p className="text-xs text-muted">Up {formatKES(-sp.change)} since you saved it</p>}
                    </>
                  );
                })()}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link href={`/product/${item.slug}`} className="tap-target rounded-full bg-primary px-4 py-1.5 text-center text-xs font-semibold text-white hover:bg-primary-dark">View</Link>
                {item.id && (
                  <button
                    type="button"
                    onClick={() => { addItem({ productId: item.id!, slug: item.slug, name: item.name, image: item.image, unitPrice: item.price }); showToast("Added to cart ✓", "/cart", "View cart"); }}
                    className="tap-target rounded-full border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
                  >
                    Add to cart
                  </button>
                )}
                <button type="button" onClick={() => remove(item.slug)} className="text-xs text-muted hover:text-deal">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
