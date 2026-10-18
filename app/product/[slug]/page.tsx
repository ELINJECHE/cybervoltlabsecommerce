import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts, getCategoryBySlug, getProductBySlug, getRelatedProducts } from "@/lib/products";
import CompleteTheSet from "@/components/CompleteTheSet";
import { completeTheSet, needsChoice } from "@/lib/pairings";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, productJsonLd, productMetadata } from "@/lib/seo";
import { getAllReviews } from "@/lib/reviews";
import ImageGallery from "@/components/ImageGallery";
import PriceTag from "@/components/PriceTag";
import StarRating from "@/components/StarRating";
import StockUrgencyBar from "@/components/StockUrgencyBar";
import ProductActions from "@/components/ProductActions";
import ProductDelivery from "@/components/ProductDelivery";
import StickyBuyBar from "@/components/StickyBuyBar";
import TrackView from "@/components/TrackView";
import WishlistButton from "@/components/WishlistButton";
import PriceAlert from "@/components/PriceAlert";
import { getProductImage } from "@/lib/images";
import ProductCard from "@/components/ProductCard";
import ReviewsCarousel from "@/components/ReviewsCarousel";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return productMetadata(product);
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const setPicks = completeTheSet(product, await getAllProducts());
  const reviews = getAllReviews();
  const category = await getCategoryBySlug(product.category);
  const categoryName = category?.name ?? product.category.replace(/-/g, " ");
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div>
    <JsonLd
      data={[
        // A Product listing without a photo is invalid structured data, so leave it out.
        ...(product.images.length > 0 ? [productJsonLd(product, categoryName)] : []),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: categoryName, path: `/category/${product.category}` },
          { name: product.name, path: `/product/${product.slug}` },
        ]),
      ]}
    />
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-primary">Home</Link>
        {" / "}
        <Link href={`/category/${product.category}`} className="hover:text-primary">
          {categoryName}
        </Link>
        {" / "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold leading-snug sm:text-2xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              {product.reviewCount > 0 && (
                <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              )}
              {product.verified && (
                <span className="inline-flex items-center gap-1 rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  ✓ Cybervolt Verified
                </span>
              )}
            </div>
          </div>

          <PriceTag price={product.price} discountPrice={product.discountPrice} size="lg" />

          <ProductDelivery price={product.discountPrice ?? product.price} />
          <div className="flex flex-wrap items-start gap-2">
            <WishlistButton
              variant="inline"
              item={{ slug: product.slug, name: product.name, price: product.discountPrice ?? product.price, image: getProductImage(product.images), id: product.id }}
            />
            <PriceAlert slug={product.slug} name={product.name} price={product.discountPrice ?? product.price} />
          </div>

          {isLowStock && (
            <p className="text-sm font-medium text-deal">Only {product.stock} left in stock — order soon</p>
          )}
          {product.isDeal && product.dealClaimedPercent !== undefined && (
            <StockUrgencyBar claimedPercent={product.dealClaimedPercent} />
          )}

          {product.description && <p className="text-sm text-muted">{product.description}</p>}

          {product.features.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-sm">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-success">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <div id="buy-actions">
            <ProductActions product={product} />
          </div>
          <TrackView item={{ slug: product.slug, name: product.name, price: product.discountPrice ?? product.price, image: getProductImage(product.images) }} />
          <StickyBuyBar
            productId={product.id}
            slug={product.slug}
            name={product.name}
            image={getProductImage(product.images)}
            price={product.discountPrice ?? product.price}
            needsChoice={(product.colors?.length ?? 0) > 0 || product.category === "sneakers-shoes"}
          />
        </div>
      </div>

      <CompleteTheSet
        current={needsChoice(product) ? null : { id: product.id, slug: product.slug, name: product.name, image: getProductImage(product.images), price: product.discountPrice ?? product.price }}
        picks={setPicks.map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: getProductImage(p.images), price: p.discountPrice ?? p.price }))}
      />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-bold">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>

    <ReviewsCarousel reviews={reviews} />
    </div>
  );
}
