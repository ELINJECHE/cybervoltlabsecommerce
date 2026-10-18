"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { getProductImage } from "@/lib/images";
import { useCart } from "@/lib/cart-context";
import { MAX_PER_ORDER } from "@/lib/community";
import { buildProductEnquiryLink } from "@/lib/whatsapp";
import WhatsAppChatLink from "@/components/WhatsAppChatLink";

export default function ProductActions({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  // window.location.href is unavailable during SSR, so the link starts
  // without it and picks up the page URL after mount — computing it inline
  // would make the server and first client render disagree.
  const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);
  useEffect(() => setPageUrl(window.location.href), []);

  const unitPrice = product.discountPrice ?? product.price;

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: getProductImage(product.images),
        unitPrice,
        color: selectedColor,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {product.colors && product.colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Color{selectedColor ? `: ${selectedColor}` : ""}
          </p>
          <div className="flex gap-2">
            {product.colors.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedColor(color.name)}
                aria-label={color.name}
                aria-pressed={selectedColor === color.name}
                className={`tap-target h-9 w-9 rounded-full border-2 ${
                  selectedColor === color.name ? "border-primary" : "border-border"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold">Quantity</p>
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="tap-target flex items-center justify-center px-3 text-lg"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_PER_ORDER, q + 1))}
            aria-label="Increase quantity"
            className="tap-target flex items-center justify-center px-3 text-lg"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          className="tap-target flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="tap-target flex-1 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light"
        >
          Buy Now
        </button>
      </div>

      {/* The "face" behind Chat Nami: swap the initials for a real photo once chosen. */}
      <div className="flex items-end gap-2">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp text-xs font-bold text-white"
        >
          CV
        </span>
        <p className="rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2 text-sm">
          Hey, niko hapa! Would you like my assistance with anything kuhusu{" "}
          <span className="font-semibold">{product.name}</span>?
        </p>
      </div>

      <WhatsAppChatLink
        href={buildProductEnquiryLink(product.name, pageUrl)}
        button="chat_nami"
        placement="product_page"
        product={product.slug}
        className="tap-target flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
      >
        💬 Chat Nami
      </WhatsAppChatLink>
    </div>
  );
}
