import type { MetadataRoute } from "next";
import { getAllProducts, getActiveCategories } from "@/lib/products";
import { PRICE_STEPS } from "@/lib/price-steps";

const SITE_URL = "https://cybervoltlabs.co.ke";

// Static export bakes this in at build time, same as every other page —
// it reflects the catalog as of the last rebuild, not live data.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getActiveCategories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/returns`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.7 },
    ...PRICE_STEPS.map((p) => ({ url: `${SITE_URL}/under/${p}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
