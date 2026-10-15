import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/products";
import CategoryPageClient from "@/components/CategoryPageClient";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, categoryJsonLd, categoryMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const categories = await getActiveCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};
  return categoryMetadata(category, await getProductsByCategory(category.slug));
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return (
    <div>
      <JsonLd
        data={[
          categoryJsonLd(category, products),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: category.name, path: `/category/${category.slug}` },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <h1 className="text-xl font-bold">{category.name}</h1>
      </div>
      <Suspense>
        <CategoryPageClient category={category} products={products} />
      </Suspense>
    </div>
  );
}
