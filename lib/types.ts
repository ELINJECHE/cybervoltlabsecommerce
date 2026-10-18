export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string; // Category["slug"]
  subcategory?: string; // subcategory slug within the category
  price: number; // market price (KES), shown struck through when discountPrice is set
  discountPrice?: number; // current selling price (KES)
  images: string[]; // paths under /assets/images
  colors?: ProductColor[];
  features: string[];
  rating: number; // 0-5; 0 means no reviews yet — UI hides the rating row rather than showing "0 stars"
  reviewCount: number;
  // 0 (or omitted) means stock isn't tracked for this item — e.g. a dropship/
  // made-to-order product — and it's always orderable. Only a positive number
  // is treated as a real limited-quantity signal (drives "Only X left").
  stock: number;
  isDeal?: boolean;
  dealEndsAt?: string; // ISO datetime, required when isDeal is true
  dealClaimedPercent?: number; // 0-100, drives the stock-urgency bar
  isNewArrival?: boolean;
  verified?: boolean; // "Cybervolt Verified" trust badge
  description?: string;
}

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  image: string;
  subcategories: Subcategory[];
}

export interface Review {
  id: string;
  name: string; // real customer name only — never fabricated
  location?: string; // e.g. "Nairobi" — only if the customer actually gave one
  rating: number; // 1-5
  date: string; // ISO date, when the review was actually left
  text: string;
  source: "google" | "whatsapp" | "instagram" | "facebook" | "direct";
}
