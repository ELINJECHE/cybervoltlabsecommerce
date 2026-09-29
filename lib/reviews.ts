import reviewsData from "@/data/reviews.json";
import type { Review } from "@/lib/types";

// Real reviews only, added by hand as they come in — see data/reviews.json.
// Never generate placeholder/sample entries here; an empty list means the
// section stays hidden rather than showing fabricated social proof.
const reviews = reviewsData as Review[];

export function getAllReviews(): Review[] {
  return [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAverageRating(list: Review[]): number {
  if (list.length === 0) return 0;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
}
