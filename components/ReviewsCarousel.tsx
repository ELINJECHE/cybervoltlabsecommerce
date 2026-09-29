"use client";

import { useRef } from "react";
import type { Review } from "@/lib/types";
import { getAverageRating } from "@/lib/reviews";
import StarRating from "@/components/StarRating";

const SOURCE_LABEL: Record<Review["source"], string> = {
  google: "Posted on Google",
  whatsapp: "via WhatsApp",
  instagram: "via Instagram",
  facebook: "via Facebook",
  direct: "Verified Customer",
};

export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  // No fabricated placeholder reviews — the section simply doesn't render
  // until there are real ones to show.
  if (reviews.length === 0) return null;

  const average = getAverageRating(reviews);

  function scrollBy(amount: number) {
    railRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-4 text-lg font-bold">What Our Customers Are Saying</h2>

      <div className="relative">
        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-1"
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              className="w-[85vw] shrink-0 snap-start rounded-card border border-border bg-surface p-4 sm:w-80"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{review.name}</p>
                  {review.location && <p className="text-xs text-muted">{review.location}</p>}
                </div>
                <span className="shrink-0 text-right text-[11px] text-muted">
                  {new Date(review.date).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="mt-2">
                <StarRating rating={review.rating} size="md" />
              </div>

              <p className="mt-2 text-sm text-muted">{review.text}</p>

              <p className="mt-3 text-[11px] font-medium text-primary">{SOURCE_LABEL[review.source]}</p>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(-320)}
          aria-label="Previous reviews"
          className="tap-target absolute -left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-card sm:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollBy(320)}
          aria-label="Next reviews"
          className="tap-target absolute -right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-card sm:flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-sm text-muted">
        <strong className="text-foreground">{average.toFixed(1)}</strong> out of 5, based on{" "}
        <strong className="text-foreground">{reviews.length}</strong> review{reviews.length === 1 ? "" : "s"}
      </p>
    </section>
  );
}
