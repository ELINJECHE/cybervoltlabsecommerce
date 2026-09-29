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
// Deliberately NOT cached at module scope: unlike a one-shot `next build`,
// a long-running process (like `next dev`, or any server) would otherwise
// freeze on whatever the first fetch happened to return for its entire
// lifetime, hiding every admin edit until a full restart.

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
  jumia_url: string | null;
}

interface CategoryRow {
  slug: string;
  name: string;
  image: string;
  subcategories: { slug: string; name: string }[];
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
    images: row.images ?? [],
    colors: row.colors ?? undefined,
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
    jumiaUrl: row.jumia_url ?? undefined,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    image: row.image,
    subcategories: row.subcategories ?? [],
  };
}

async function loadProducts(): Promise<Product[]> {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from("products").select("*").order("id");
    if (!error && data) {
      return (data as ProductRow[]).map(rowToProduct);
    }
    console.warn("Supabase product fetch failed, falling back to data/products.json:", error?.message);
  }

  return productsData as Product[];
}

async function loadCategories(): Promise<Category[]> {
  if (supabaseEnabled) {
    const { data, error } = await supabase.from("categories").select("*").order("slug");
    if (!error && data) {
      return (data as CategoryRow[]).map(rowToCategory);
    }
    console.warn("Supabase category fetch failed, falling back to data/categories.json:", error?.message);
  }

  return categoriesData as Category[];
}

export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getAllCategories(): Promise<Category[]> {
  return loadCategories();
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
