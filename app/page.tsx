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
  getAllCategories,
  getDealProducts,
  getNewArrivals,
  getRecommendedProducts,
} from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";

const HERO_SLIDES = [
  {
    image: "/assets/images/hero-1.png",
    alt: "Phones, fashion and home essentials from Cybervolt Labs",
    title: "Everything You Need, One Shop",
    subtitle: "Phones, fashion, home essentials and more — delivered across Kenya.",
    ctaText: "Shop Mobile & Accessories",
    ctaHref: "/category/mobile-laptop-accessories",
  },
  {
    image: "/assets/images/hero-2.png",
    alt: "Power banks and electronics from Cybervolt Labs",
    title: "Power Your Day, Every Day",
    subtitle: "Power banks, cables and electronics that keep up with you.",
    ctaText: "Shop Electronics",
    ctaHref: "/category/electronics",
  },
  {
    image: "/assets/images/hero-3.png",
    alt: "Furniture and home décor from Cybervolt Labs",
    title: "Style Your Space",
    subtitle: "Furniture and décor to make anywhere feel like home.",
    ctaText: "Shop Furniture",
    ctaHref: "/category/furniture",
  },
];

export default async function HomePage() {
  const categories = await getAllCategories();
  const deals = await getDealProducts();
  const newArrivals = await getNewArrivals();
  const recommended = await getRecommendedProducts();
  const reviews = getAllReviews();

  return (
    <div>
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
          storefront brings all of that under one roof — from mobile phones and laptops to
          fashion accessories, furniture, home décor, motorcycle gear and cyber cafe supplies.
        </p>
        <p className="mb-3">
          Browse our{" "}
          <Link href="/category/mobile-phones" className="font-medium text-primary hover:underline">
            mobile phones
          </Link>
          ,{" "}
          <Link href="/category/furniture" className="font-medium text-primary hover:underline">
            furniture
          </Link>{" "}
          and{" "}
          <Link href="/category/fashion-accessories" className="font-medium text-primary hover:underline">
            fashion accessories
          </Link>{" "}
          collections to see what&rsquo;s trending this week. Every order is confirmed over
          WhatsApp with M-Pesa payment on delivery.
        </p>
        <p>
          Whether you found us through a TikTok video or a WhatsApp forward, welcome — fair
          prices, and support that actually replies.
        </p>
      </section>
    </div>
  );
}
