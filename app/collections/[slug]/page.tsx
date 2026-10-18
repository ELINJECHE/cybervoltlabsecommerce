import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { pageMetadata } from "@/lib/seo";
import ShowMoreGrid from "@/components/ShowMoreGrid";

export async function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCollection(params.slug);
  if (!c) return {};
  return pageMetadata({
    title: `${c.title} in Kenya`,
    description: `${c.description} Same-day delivery in Nairobi, pay with M-Pesa.`.slice(0, 158),
    path: `/collections/${c.slug}`,
  });
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const c = getCollection(params.slug);
  if (!c) notFound();

  const products = (await getAllProducts())
    .filter(c.match)
    .sort((a, b) => b.images.length - a.images.length || (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">Home</Link> / <span className="text-foreground">{c.title}</span>
      </nav>
      <h1 className="text-xl font-bold">{c.icon} {c.title}</h1>
      <p className="mb-4 max-w-2xl text-sm text-muted">{c.description} {products.length} items.</p>
      <ShowMoreGrid products={products.slice(0, 60)} />
    </div>
  );
}
