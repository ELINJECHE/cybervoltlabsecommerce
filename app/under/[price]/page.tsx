import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatKES } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import ShowMoreGrid from "@/components/ShowMoreGrid";
import PriceChips from "@/components/PriceChips";
import { PRICE_STEPS } from "@/lib/price-steps";

export async function generateStaticParams() {
  return PRICE_STEPS.map((p) => ({ price: String(p) }));
}

function limitFrom(params: { price: string }) {
  const n = Number(params.price);
  return PRICE_STEPS.includes(n) ? n : null;
}

export function generateMetadata({ params }: { params: { price: string } }): Metadata {
  const limit = limitFrom(params);
  if (!limit) return {};
  return pageMetadata({
    title: `Products under ${formatKES(limit)} in Kenya`,
    description: `Shop products under ${formatKES(limit)} at Cybervolt Labs. Same-day delivery in Nairobi, pay with M-Pesa.`,
    path: `/under/${limit}`,
  });
}

export default async function UnderPage({ params }: { params: { price: string } }) {
  const limit = limitFrom(params);
  if (!limit) notFound();

  const all = await getAllProducts();
  const matches = all
    .filter((p) => (p.discountPrice ?? p.price) <= limit)
    .sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
  // Best value near the budget first; capped so the page stays light.
  const shown = matches.slice(0, 60);

  return (
    <div>
      <PriceChips />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
          <Link href="/" className="hover:text-primary">Home</Link> / <span className="text-foreground">Under {formatKES(limit)}</span>
        </nav>
        <h1 className="text-xl font-bold">Under {formatKES(limit)}</h1>
        <p className="mb-4 text-sm text-muted">
          {matches.length} product{matches.length === 1 ? "" : "s"} you can get for {formatKES(limit)} or less
          {matches.length > shown.length ? ` (showing the ${shown.length} closest to your budget)` : ""}.
        </p>
        <ShowMoreGrid products={shown} />
      </div>
    </div>
  );
}
