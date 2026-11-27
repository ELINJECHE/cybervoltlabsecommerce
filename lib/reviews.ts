import reviewsData from "@/data/reviews.json";
import type { Review } from "@/lib/types";

// Real reviews only, added by hand as they come in — see data/reviews.json.
// Never generate placeholder/sample entries here; an empty list means the
// section stays hidden rather than showing fabricated social proof.
const reviews = reviewsData as Review[];

export function getAllReviews(): Review[] {
  return [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Reviews written about one particular product (data/reviews.json entries with a productSlug).
export function getProductReviews(slug: string): Review[] {
  return getAllReviews().filter((r) => r.productSlug === slug);
}

// Reviews of the shop as a whole: the ones not tied to a product.
export function getStoreReviews(): Review[] {
  return getAllReviews().filter((r) => !r.productSlug);
}

export function getAverageRating(list: Review[]): number {
  if (list.length === 0) return 0;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
}
