import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getProductImage } from "@/lib/images";
import PriceTag from "@/components/PriceTag";
import StarRating from "@/components/StarRating";
import QuickAdd from "@/components/QuickAdd";
import WishlistButton from "@/components/WishlistButton";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  /** Set for the first cards in a grid (e.g. index < 4) so they aren't lazy-loaded and can't win the page's LCP race while lazy — see components/ProductCard.tsx usage sites. */
  priority?: boolean;
}) {
  const isLowStock = product.stock > 0 && product.stock <= 10;
  // Shoes need a size and some products need a colour, so those open the product page instead.
  const canQuickAdd = !(product.colors && product.colors.length > 0) && product.category !== "sneakers-shoes";

  return (
    <div className="relative h-full">
    {canQuickAdd && (
      <QuickAdd
        productId={product.id}
        slug={product.slug}
        name={product.name}
        image={getProductImage(product.images)}
        price={product.discountPrice ?? product.price}
      />
    )}
    <WishlistButton
      item={{ slug: product.slug, name: product.name, price: product.discountPrice ?? product.price, image: getProductImage(product.images), id: product.id }}
    />
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col rounded-card border border-border bg-surface shadow-card transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-card bg-primary-light">
        <Image
          src={getProductImage(product.images)}
          alt={product.name}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isDeal && (
            <span className="rounded bg-deal px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Deal
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>
        {isLowStock && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        {product.reviewCount > 0 && (
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        )}
        <PriceTag price={product.price} discountPrice={product.discountPrice} />

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5" aria-hidden="true">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                className="h-3.5 w-3.5 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}

        {product.verified && (
          <span className="mt-auto inline-flex w-fit items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
            ✓ Cybervolt Verified
          </span>
        )}
      </div>
    </Link>
    </div>
  );
}
