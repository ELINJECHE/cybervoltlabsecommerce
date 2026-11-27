export interface ProductColor {
  name: string;
  hex: string;
}

// One line of the specification table, e.g. { label: "Material", value: "Genuine leather" }.
export interface ProductSpec {
  label: string;
  value: string;
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
  // made-to-order product — and it's always orderable. A positive number is a
  // real limited-quantity signal (drives "Only X left"). -1 means SOLD OUT: the
  // page says so, Add to Cart is off and Google is told "out of stock".
  stock: number;
  isDeal?: boolean;
  dealEndsAt?: string; // ISO datetime, required when isDeal is true
  dealClaimedPercent?: number; // 0-100, drives the stock-urgency bar
  isNewArrival?: boolean;
  verified?: boolean; // "Cybervolt Verified" trust badge
  description?: string;
  // Google Merchant Center facts, from data/merchant-attributes.json (see lib/merchant.ts).
  brand?: string;
  mpn?: string; // manufacturer part number
  condition?: "new" | "used" | "refurbished"; // omitted = new
  sizes?: string[]; // when set, the visitor picks one (shoes)
  gtin?: string; // barcode (EAN/UPC), checked before it is accepted
  // Everything below is worked out in lib/attributes.ts from the "Label: value" lines in `features` (what the admin
  // form writes), so no database change is needed. `features` itself keeps only the plain bullet points.
  specs?: ProductSpec[]; // the specification table
  type?: string; // what kind of product it is within its category (Helmets, Gloves, Microwaves ...)
  facets?: Record<string, string[]>; // every filterable fact: Type, Brand, Colour, Capacity and each spec
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
  /** Slug of the product this review is about. Leave out for a review of the shop as a whole. */
  productSlug?: string;
}
