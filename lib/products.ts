import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import type { Category, Product } from "@/lib/types";
import { supabase, supabaseEnabled } from "@/lib/supabase";

// Every page/component reads product & category data through this module —
// never import the JSON files directly elsewhere.
//
// Source of truth: Supabase (products/categories tables) when configured,
// with data/*.json as a fallback for local dev without Supabase set up.
// These run at BUILD time in production (the site is still a static export)
// — the admin panel writes to Supabase, then triggers a rebuild via the
// deploy hook so the new/edited data gets baked into the next static build.
//
// Cached at module scope, but ONLY in production (i.e. during the one-shot
// `next build` that makes this static export) — every page function below
// calls loadProducts()/loadCategories() independently, and without this the
// full catalog gets re-fetched from Supabase for nearly every one of the
// hundreds of pages generated, slow enough to blow past a host's build time
// limit once the catalog grows. In `next dev` this stays uncached so admin
// edits keep showing up immediately without a restart — the bug this
// guarded against previously.

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
  colors: { name: string; hex: string }[] | null;
  features: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_deal: boolean;
  deal_ends_at: string | null;
  deal_claimed_percent: number | null;
  is_new_arrival: boolean;
  verified: boolean;
  description: string | null;
}

interface CategoryRow {
  slug: string;
  name: string;
  image: string;
  subcategories: { slug: string; name: string }[];
}

// Only {name, hex} objects are valid swatches — drop anything else (e.g. bare
// strings) so a malformed row can't break swatches, the colour filter or the
// cart's colour selection.
function validColors(colors: ProductRow["colors"]): Product["colors"] {
  if (!Array.isArray(colors)) return undefined;
  const valid = colors.filter(
    (c) => c !== null && typeof c === "object" && typeof c.name === "string" && typeof c.hex === "string"
  );
  return valid.length > 0 ? valid : undefined;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    price: row.price,
    discountPrice: row.discount_price ?? undefined,
    // Drop leftover placeholder artwork that predates the real product photos.
    images: (row.images ?? []).filter((src) => !/^\/assets\/images\/products\/.*\.svg$/.test(src)),
    colors: validColors(row.colors),
    features: row.features ?? [],
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    stock: row.stock ?? 0,
    isDeal: row.is_deal ?? undefined,
    dealEndsAt: row.deal_ends_at ?? undefined,
    dealClaimedPercent: row.deal_claimed_percent ?? undefined,
    isNewArrival: row.is_new_arrival ?? undefined,
    verified: row.verified ?? undefined,
    description: row.description ?? undefined,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image || `/assets/images/category-${row.slug}.png`,
    subcategories: row.subcategories ?? [],
  };
}

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;

async function loadProducts(): Promise<Product[]> {
  if (cachedProducts) return cachedProducts;

  let result: Product[];
  if (supabaseEnabled) {
    const { data, error } = await supabase.from("products").select("*").order("id");
    if (!error && data) {
      result = (data as ProductRow[]).map(rowToProduct);
    } else {
      console.warn("Supabase product fetch failed, falling back to data/products.json:", error?.message);
      result = productsData as Product[];
    }
  } else {
    result = productsData as Product[];
  }

  // A product with no price yet stays out of the shop (it would read "KSh 0"). It still exists in
  // the admin panel and appears here as soon as it is given a price.
  result = result.filter((p) => p.price > 0);

  if (process.env.NODE_ENV === "production") cachedProducts = result;
  return result;
}

async function loadCategories(): Promise<Category[]> {
  if (cachedCategories) return cachedCategories;

  let result: Category[];
  if (supabaseEnabled) {
    const { data, error } = await supabase.from("categories").select("*").order("slug");
    if (!error && data) {
      result = (data as CategoryRow[]).map(rowToCategory);
    } else {
      console.warn("Supabase category fetch failed, falling back to data/categories.json:", error?.message);
      result = categoriesData as Category[];
    }
  } else {
    result = categoriesData as Category[];
  }

  if (process.env.NODE_ENV === "production") cachedCategories = result;
  return result;
}

export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

// Every product id, including ones still waiting for a price that the shop hides. The admin edit
// pages are built from this list so an unpriced product can always be opened and priced.
export async function getAllProductIds(): Promise<string[]> {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from("products").select("id");
    if (!error && data) return (data as { id: string }[]).map((r) => r.id);
  }
  return (productsData as Product[]).map((p) => p.id);
}

export async function getAllCategories(): Promise<Category[]> {
  return loadCategories();
}

// Categories that currently have at least one product. An empty category would be a
// dead-end page in the menu and in search results, so it stays hidden until it has stock.
const CATEGORY_PRIORITY = [
  "motorcycle-gear",
  "sneakers-shoes",
  "home-appliances",
  "audio-speakers",
  "sports-leisure",
  "furniture",
  "interior-design",
  "kitchen-dining",
];

export async function getActiveCategories(): Promise<Category[]> {
  const [categories, products] = await Promise.all([loadCategories(), loadProducts()]);
  const stocked = new Set(products.map((p) => p.category));
  // Lead with the best-margin and fastest-selling categories; the rest follow in slug order.
  const rank = (slug: string) => {
    const i = CATEGORY_PRIORITY.indexOf(slug);
    return i === -1 ? CATEGORY_PRIORITY.length : i;
  };
  return categories.filter((c) => stocked.has(c.slug)).sort((a, b) => rank(a.slug) - rank(b.slug));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await loadCategories();
  return categories.find((c) => c.slug === slug);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await loadProducts();
  return products.find((p) => p.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await loadProducts();
  return products.filter((p) => p.category === categorySlug);
}

export async function getDealProducts(): Promise<Product[]> {
  const products = await loadProducts();
  return products.filter((p) => p.isDeal);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await loadProducts();
  return products.filter((p) => p.isNewArrival);
}

export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const products = await loadProducts();
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export async function getRecommendedProducts(excludeId?: string): Promise<Product[]> {
  const products = await loadProducts();
  return products.filter((p) => p.id !== excludeId);
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
}

// Pure, synchronous — operates on an already-fetched list, used client-side
// for interactive filtering (not a data-loading function).
export function filterProducts(list: Product[], filters: ProductFilters): Product[] {
  return list.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    const effectivePrice = p.discountPrice ?? p.price;
    if (filters.minPrice !== undefined && effectivePrice < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && effectivePrice > filters.maxPrice) return false;
    if (filters.colors && filters.colors.length > 0) {
      const productColorNames = (p.colors ?? []).map((c) => c.name);
      if (!filters.colors.some((c) => productColorNames.includes(c))) return false;
    }
    return true;
  });
}

export function getAllColors(list: Product[]): string[] {
  const names = new Set<string>();
  for (const p of list) {
    for (const c of p.colors ?? []) names.add(c.name);
  }
  return Array.from(names).sort();
}
