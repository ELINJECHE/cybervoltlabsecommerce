"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { getProductImage } from "@/lib/images";
import { useCart } from "@/lib/cart-context";
import { MAX_PER_ORDER } from "@/lib/community";
import { buildProductEnquiryLink } from "@/lib/whatsapp";
import WhatsAppChatLink from "@/components/WhatsAppChatLink";

export default function ProductActions({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  // window.location.href is unavailable during SSR, so the link starts
  // without it and picks up the page URL after mount — computing it inline
  // would make the server and first client render disagree.
  const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);
  useEffect(() => setPageUrl(window.location.href), []);

  // Links from Google can name a size (?size=42): start with it chosen.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("size");
    if (wanted && product.sizes?.includes(wanted)) setSelectedSize(wanted);
  }, [product.sizes]);

  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const soldOut = product.stock < 0;

  const unitPrice = product.discountPrice ?? product.price;

  function handleAddToCart() {
    if (hasSizes && !selectedSize) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: getProductImage(product.images),
        unitPrice,
        color: selectedColor,
        size: selectedSize,
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

      {hasSizes && (
        <div id="size-picker">
          <p className="mb-2 text-sm font-semibold">Size{selectedSize ? `: ${selectedSize}` : ""}</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes!.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
                aria-pressed={selectedSize === size}
                className={`tap-target min-w-11 rounded-md border px-3 py-2 text-sm font-medium ${
                  selectedSize === size ? "border-primary bg-primary-light text-primary" : "border-border"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {sizeError && (
            <p role="alert" className="mt-2 text-sm text-deal">
              Please choose a size.
            </p>
          )}
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

      {soldOut ? (
        <div className="rounded-card border border-border bg-surface p-3 text-sm">
          <p className="font-semibold">Sold out</p>
          <p className="mt-1 text-muted">This item is out of stock right now. Message us on WhatsApp and we&rsquo;ll tell you when it&rsquo;s back.</p>
        </div>
      ) : (
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
            onClick={() => {
              if (hasSizes && !selectedSize) {
                setSizeError(true);
                document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
              }
              router.push("/cart");
            }}
            className="tap-target flex-1 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light"
          >
            Buy Now
          </button>
        </div>
      )}

      {/* The "face" behind Chat Nami: Nami, our illustrated brand ambassador. */}
      <div className="flex items-end gap-2">
        <Image
          src="/assets/images/nami.webp"
          alt="Nami, the illustrated Cybervolt Labs brand ambassador"
          width={640}
          height={700}
          className="h-auto w-32 shrink-0 rounded-2xl border border-border bg-white sm:w-44"
        />
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
