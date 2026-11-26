import data from "@/data/merchant-attributes.json";
import type { Product } from "@/lib/types";

// Facts Google Merchant Center asks for that the shop database does not hold (yet): brand, manufacturer part
// number, condition and the sizes to pick from. Kept in data/merchant-attributes.json, keyed by product slug.
export interface MerchantAttrs {
  brand?: string;
  mpn?: string;
  condition?: "new" | "used" | "refurbished";
  sizes?: string[];
  gmc?: boolean; // listed in Google Merchant Center
}

const attrs = data as unknown as Record<string, MerchantAttrs>;

export function merchantAttrs(slug: string): MerchantAttrs {
  return slug.startsWith("_") ? {} : attrs[slug] ?? {};
}

// Adds the Merchant Center facts for this product (only the ones that are set).
export function withMerchantAttrs(product: Product): Product {
  const a = merchantAttrs(product.slug);
  return {
    ...product,
    ...(a.brand ? { brand: a.brand } : {}),
    ...(a.mpn ? { mpn: a.mpn } : {}),
    ...(a.condition ? { condition: a.condition } : {}),
    ...(a.sizes && a.sizes.length > 0 ? { sizes: a.sizes } : {}),
  };
}
