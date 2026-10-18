"use client";

import { useCart } from "@/lib/cart-context";
import { showToast } from "@/lib/toast";

// The "+" on a product card: adds one to the cart without leaving the page.
export default function QuickAdd({ productId, slug, name, image, price }: {
  productId: string; slug: string; name: string; image: string; price: number;
}) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      aria-label={`Add ${name} to cart`}
      onClick={() => {
        addItem({ productId, slug, name, image, unitPrice: price });
        showToast("Added to cart ✓", "/cart", "View cart");
      }}
      className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/80 text-xl leading-none text-white shadow transition hover:bg-foreground"
    >
      +
    </button>
  );
}
