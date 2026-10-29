"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatKES } from "@/lib/format";
import { getAllReviews } from "@/lib/reviews";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import CartDelivery from "@/components/CartDelivery";
import CommunityStrip from "@/components/CommunityStrip";
import RecommendedForYou from "@/components/RecommendedForYou";
import { MAX_PER_ORDER } from "@/lib/community";
import CartToWhatsApp from "@/components/CartToWhatsApp";
import RecentlyViewed from "@/components/RecentlyViewed";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const reviews = getAllReviews();

  if (items.length === 0) {
    return (
      <div>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted">Browse our catalog and add something you like.</p>
          <Link
            href="/"
            className="tap-target mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Continue Shopping
          </Link>
        </div>
        <RecentlyViewed />
        <RecommendedForYou title="Popular picks to get you started" subtitle="Based on what shoppers like you look at" />
        <ReviewsCarousel reviews={reviews} />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Your Cart</h1>

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.color ?? ""}`}
              className="flex gap-3 rounded-card border border-border bg-surface p-3"
            >
              <Link href={`/product/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-primary-light">
                <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                    {item.name}
                  </Link>
                  {item.color && <p className="text-xs text-muted">Color: {item.color}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.color, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="tap-target flex items-center justify-center px-2.5 text-base"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.color, Math.min(MAX_PER_ORDER, item.quantity + 1))}
                      aria-label="Increase quantity"
                      className="tap-target flex items-center justify-center px-2.5 text-base"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold">{formatKES(item.unitPrice * item.quantity)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productId, item.color)}
                aria-label={`Remove ${item.name}`}
                className="tap-target self-start text-muted hover:text-deal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-card border border-border bg-surface p-4">
          <span className="text-sm font-semibold">Subtotal</span>
          <span className="text-lg font-bold">{formatKES(subtotal)}</span>
        </div>
        <CartDelivery subtotal={subtotal} />

        <Link
          href="/checkout"
          className="tap-target mt-4 flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Proceed to Checkout
        </Link>
        <CartToWhatsApp />
        <p className="mt-2 text-center text-xs text-muted">Up to {MAX_PER_ORDER} of each item per order.</p>
      </div>

      <RecommendedForYou title="You might also need" subtitle="Picked from what you have in your cart and have looked at" />

      <CommunityStrip />

      <ReviewsCarousel reviews={reviews} />
    </div>
  );
}
