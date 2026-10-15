import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import HotSearchChips from "@/components/HotSearchChips";
import FlashDealBanner from "@/components/FlashDealBanner";
import CategoryRail from "@/components/CategoryRail";
import ProductCard from "@/components/ProductCard";
import ShowMoreGrid from "@/components/ShowMoreGrid";
import TrustSection from "@/components/TrustSection";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import {
  getActiveCategories,
  getDealProducts,
  getNewArrivals,
  getRecommendedProducts,
} from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";
import JsonLd from "@/components/JsonLd";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

const HERO_SLIDES = [
  {
    image: "/assets/images/hero-1.webp",
    alt: "Cybervolt Labs featured products",
    title: "Order Today. Get It Today.",
    subtitle: "Same-day delivery in Nairobi on motorcycle gear, sneakers and home essentials. Countrywide in 2–4 days.",
    ctaText: "Shop Motorcycle Gear",
    ctaHref: "/category/motorcycle-gear",
  },
  {
    image: "/assets/images/hero-2.webp",
    alt: "Cybervolt Labs electronics and gadgets",
    title: "Smart Picks for Every Day",
    subtitle: "Smart watches, appliances and handy gadgets that keep up with you.",
    ctaText: "Shop Electronics",
    ctaHref: "/category/electronics",
  },
  {
    image: "/assets/images/hero-3.webp",
    alt: "Cybervolt Labs home and living collection",
    title: "Style Your Space",
    subtitle: "Bedding and home décor to make anywhere feel like home.",
    ctaText: "Shop Home & Décor",
    ctaHref: "/category/interior-design",
  },
];

export default async function HomePage() {
  const categories = await getActiveCategories();
  const deals = await getDealProducts();
  const newArrivals = await getNewArrivals();
  const recommended = await getRecommendedProducts();
  const reviews = getAllReviews();

  return (
    <div>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <h1 className="sr-only">Cybervolt Labs — motorcycle gear, sneakers and home essentials in Kenya</h1>
      <div className="pt-4 sm:pt-6">
        <HeroCarousel slides={HERO_SLIDES} />
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-5">
        <HotSearchChips />
      </section>

      <FlashDealBanner deals={deals} />

      <CategoryRail categories={categories} />

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">New Arrivals</h2>
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {newArrivals.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-3 text-lg font-bold">You May Also Like</h2>
        <ShowMoreGrid products={recommended} />
      </section>

      <TrustSection />

      <ReviewsCarousel reviews={reviews} />

      <section className="mx-auto max-w-7xl px-4 py-8 text-sm leading-relaxed text-muted">
        <h2 className="mb-2 text-base font-bold text-foreground">About Cybervolt Labs</h2>
        <p className="mb-3">
          Cybervolt Labs is a Kenyan retail brand based in Ongata Rongai, selling across
          Instagram, Facebook, TikTok, WhatsApp, Jumia, Jiji, Kilimall and Pigiame. This
          storefront brings all of that under one roof — from motorcycle riding gear and
          sneakers to bedding, home décor and smart gadgets.
        </p>
        <p className="mb-3">
          Browse our{" "}
          <Link href="/category/motorcycle-gear" className="font-medium text-primary hover:underline">
            motorcycle gear
          </Link>
          ,{" "}
          <Link href="/category/sneakers-shoes" className="font-medium text-primary hover:underline">
            sneakers &amp; shoes
          </Link>{" "}
          and{" "}
          <Link href="/category/interior-design" className="font-medium text-primary hover:underline">
            home décor
          </Link>{" "}
          collections to see what&rsquo;s trending this week. Every order is confirmed over
          WhatsApp, and you pay by M-Pesa.
        </p>
        <p>
          Whether you found us through a TikTok video or a WhatsApp forward, welcome — fair
          prices, and support that actually replies.
        </p>
      </section>
    </div>
  );
}
