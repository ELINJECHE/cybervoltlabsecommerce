"use client";

import { supabase } from "@/lib/supabase";

// Client-side CRUD for the admin panel. Works directly with the database's
// snake_case row shape — the public site's lib/products.ts maps these same
// rows to the camelCase Product type for build-time rendering.

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
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

export type ProductInput = Omit<ProductRow, "rating" | "review_count">;

export interface CategoryRow {
  slug: string;
  name: string;
  image: string;
  subcategories: { slug: string; name: string }[];
}

// crypto.randomUUID() only exists in "secure contexts" (HTTPS, or the exact
// hostname "localhost") — accessing the admin panel via an IP, a different
// hostname, or an older browser leaves it undefined. This works everywhere.
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listProductsAdmin(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getProductAdmin(id: string): Promise<ProductRow> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Google Merchant Center: every product photo must be at least 500 x 500 px (enforced from 31 Jan 2027); 800 x 800 or
// more is best. Smaller photos are refused here, so a listing can't be rejected for them later.
export const MIN_IMAGE_PX = 500;
export const GOOD_IMAGE_PX = 800;
// Google's limits for a product title and description.
export const MAX_TITLE_CHARS = 150;
export const MAX_DESCRIPTION_CHARS = 5000;

function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const { width, height } = await imageSize(file);
  if (width < MIN_IMAGE_PX || height < MIN_IMAGE_PX) {
    throw new Error(
      `This image is ${width}×${height} px. Google Shopping needs at least ${MIN_IMAGE_PX}×${MIN_IMAGE_PX} px ` +
        `(${GOOD_IMAGE_PX}×${GOOD_IMAGE_PX} or larger is best), so it was not uploaded. Please use a bigger photo.`
    );
  }
  const ext = file.name.split(".").pop();
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function listCategoriesAdmin(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(input: { slug: string; name: string; image?: string }): Promise<void> {
  const { error } = await supabase.from("categories").insert({
    slug: input.slug,
    name: input.name,
    image: input.image ?? "",
    subcategories: [],
  });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(slug: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
