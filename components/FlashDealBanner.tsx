import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductImage } from "@/lib/images";
import PriceTag from "@/components/PriceTag";
import CountdownTimer from "@/components/CountdownTimer";
import StockUrgencyBar from "@/components/StockUrgencyBar";

export default function FlashDealBanner({ deals }: { deals: Product[] }) {
  if (deals.length === 0) return null;

  const earliestEnd = deals
    .map((d) => d.dealEndsAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between gap-3 rounded-t-card bg-deal px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
          <span aria-hidden="true">⚡</span> Flash Deals
        </h2>
        {earliestEnd && <CountdownTimer endsAt={earliestEnd} />}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide rounded-b-card border border-t-0 border-border bg-surface p-3">
        {deals.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="w-[42vw] shrink-0 rounded-card border border-border p-2 transition hover:shadow-card sm:w-40"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-primary-light">
              <Image
                src={getProductImage(product.images)}
                alt={product.name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 42vw, 160px"
                className="object-cover"
              />
            </div>
            <h3 className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{product.name}</h3>
            <div className="mt-1">
              <PriceTag price={product.price} discountPrice={product.discountPrice} />
            </div>
            {product.dealClaimedPercent !== undefined && (
              <div className="mt-2">
                <StockUrgencyBar claimedPercent={product.dealClaimedPercent} />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
