// One-time import of the existing local catalog into Supabase. Run with:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs
// The service role key is required (bypasses RLS for this bulk import) and
// must never be committed or added to .env.local — pass it inline only.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

const products = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "products.json"), "utf8"));
const categories = JSON.parse(readFileSync(path.join(__dirname, "..", "data", "categories.json"), "utf8"));

function toProductRow(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory ?? null,
    price: p.price,
    discount_price: p.discountPrice ?? null,
    images: p.images ?? [],
    colors: p.colors ?? null,
    features: p.features ?? [],
    rating: p.rating ?? 0,
    review_count: p.reviewCount ?? 0,
    stock: p.stock ?? 0,
    is_deal: p.isDeal ?? false,
    deal_ends_at: p.dealEndsAt ?? null,
    deal_claimed_percent: p.dealClaimedPercent ?? null,
    is_new_arrival: p.isNewArrival ?? false,
    verified: p.verified ?? false,
    description: p.description ?? null,
    jumia_url: p.jumiaUrl ?? null,
  };
}

function toCategoryRow(c) {
  return {
    slug: c.slug,
    name: c.name,
    image: c.image ?? "",
    subcategories: c.subcategories ?? [],
  };
}

async function main() {
  console.log(`Seeding ${categories.length} categories...`);
  const { error: catError } = await supabase.from("categories").upsert(categories.map(toCategoryRow));
  if (catError) throw new Error(`Category seed failed: ${catError.message}`);

  console.log(`Seeding ${products.length} products...`);
  const { error: prodError } = await supabase.from("products").upsert(products.map(toProductRow));
  if (prodError) throw new Error(`Product seed failed: ${prodError.message}`);

  console.log("Done. Categories and products are now live in Supabase.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
