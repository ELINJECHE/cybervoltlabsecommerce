import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/products";
import CategoryPageClient from "@/components/CategoryPageClient";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Shop ${category.name} at Cybervolt Labs — genuine stock, fair prices, M-Pesa payment on delivery.`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <h1 className="text-xl font-bold">{category.name}</h1>
      </div>
      <Suspense>
        <CategoryPageClient category={category} products={products} />
      </Suspense>
    </div>
  );
}
