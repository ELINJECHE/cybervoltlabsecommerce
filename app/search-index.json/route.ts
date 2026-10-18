import { getActiveCategories, getAllProducts } from "@/lib/products";
import { getProductImage } from "@/lib/images";

// A compact catalogue file (/search-index.json), built with the site and fetched the first time
// someone clicks the search box, so the suggestions work without loading every product up front.
export const dynamic = "force-static";

export async function GET() {
  const [products, categories] = await Promise.all([getAllProducts(), getActiveCategories()]);
  return Response.json({
    categories: categories.map((c) => [c.slug, c.name]),
    products: products.map((p) => [p.slug, p.name, p.discountPrice ?? p.price, p.category, getProductImage(p.images)]),
  });
}
