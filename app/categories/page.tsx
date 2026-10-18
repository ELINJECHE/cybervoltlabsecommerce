import Image from "next/image";
import Link from "next/link";
import { getActiveCategories, getAllProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "All categories",
  description: "Browse every Cybervolt Labs category: motorcycle gear, shoes, appliances, audio, home and more. Same-day delivery in Nairobi.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([getActiveCategories(), getAllProducts()]);
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">All categories</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              className="flex h-full flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center shadow-card hover:shadow-md"
            >
              <span className="relative block h-20 w-20 overflow-hidden rounded-full border border-border bg-primary-light">
                <Image src={c.image || "/assets/images/no-image-placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <span className="text-sm font-semibold leading-tight">{c.name}</span>
              <span className="text-xs text-muted">{counts.get(c.slug) ?? 0} products</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
