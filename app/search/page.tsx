import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";
import SearchResultsClient from "@/components/SearchResultsClient";
import ReviewsCarousel from "@/components/ReviewsCarousel";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage() {
  const products = await getAllProducts();
  const reviews = getAllReviews();

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">Search</h1>
        <Suspense>
          <SearchResultsClient products={products} />
        </Suspense>
      </div>
      <ReviewsCarousel reviews={reviews} />
    </div>
  );
}
