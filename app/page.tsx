import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import HotSearchChips from "@/components/HotSearchChips";
import FlashDealBanner from "@/components/FlashDealBanner";
import CategoryRail from "@/components/CategoryRail";
import ShowMoreGrid from "@/components/ShowMoreGrid";
import Shelf from "@/components/Shelf";
import UspStrip from "@/components/UspStrip";
import PriceChips from "@/components/PriceChips";
import CommunityStrip from "@/components/CommunityStrip";
import RecentlyViewed from "@/components/RecentlyViewed";
import RecommendedForYou from "@/components/RecommendedForYou";
import SavedDropsStrip from "@/components/SavedDropsStrip";
import { COLLECTIONS } from "@/lib/collections";
import TrustSection from "@/components/TrustSection";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import {
  getActiveCategories,
  getAllProducts,
  getDealProducts,
  getRecommendedProducts,
} from "@/lib/products";
import type { Product } from "@/lib/types";
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

// Homepage shelves, in order: the best-margin and best-selling categories lead.
const SHELVES: { slugs: string[]; title: string; subtitle: string; href: string; tint?: boolean }[] = [
  { slugs: ["motorcycle-gear"], title: "Motorcycle Gear", subtitle: "Helmets, jackets, gloves and more for the road", href: "/category/motorcycle-gear", tint: true },
  { slugs: ["sneakers-shoes"], title: "Sneakers & Shoes", subtitle: "Fresh pairs, restocked often", href: "/category/sneakers-shoes" },
  { slugs: ["home-appliances"], title: "Home Appliances", subtitle: "Microwaves, cookers, washers and kitchen helpers", href: "/category/home-appliances", tint: true },
  { slugs: ["audio-speakers"], title: "Audio & Speakers", subtitle: "Home theatre, soundbars and portable speakers", href: "/category/audio-speakers" },
  { slugs: ["sports-leisure", "furniture"], title: "Fitness, Outdoors & Seating", subtitle: "Dumbbells, camping gear, chairs and more", href: "/category/sports-leisure", tint: true },
  { slugs: ["interior-design"], title: "Home & Bedding", subtitle: "Duvets, curtains, mats and cosy touches", href: "/category/interior-design" },
  { slugs: ["kitchen-dining"], title: "Kitchen & Dining", subtitle: "Cookware, flasks, lunch boxes and more", href: "/category/kitchen-dining", tint: true },
  { slugs: ["toy-shop"], title: "Toys & Gifts", subtitle: "Something for the kids", href: "/category/toy-shop" },
];

// Richest listings first (most photos), then the pricier items.
function pickForShelf(all: Product[], slugs: string[], limit = 10): Product[] {
  return all
    .filter((p) => slugs.includes(p.category))
    .sort((a, b) => b.images.length - a.images.length || (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price))
    .slice(0, limit);
}

export default async function HomePage() {
  const categories = await getActiveCategories();
  const deals = await getDealProducts();
  const all = await getAllProducts();
  // Only a starter set goes to the "more to explore" grid; the rest is a click away.
  const recommended = (await getRecommendedProducts()).slice(0, 40);
  const reviews = getAllReviews();

  return (
    <div>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <h1 className="sr-only">Cybervolt Labs — motorcycle gear, sneakers and home essentials in Kenya</h1>
      <div className="pt-4 sm:pt-6">
        <HeroCarousel slides={HERO_SLIDES} />
      </div>

      <UspStrip />

      <section className="mx-auto max-w-7xl px-4 pt-5">
        <HotSearchChips />
      </section>

      <FlashDealBanner deals={deals} />

      <CategoryRail categories={categories} />

      <SavedDropsStrip />

      <RecentlyViewed />

      <RecommendedForYou />

      <PriceChips />

      <section className="mx-auto max-w-7xl px-4 pt-4" aria-label="Shop by need">
        <p className="mb-2 text-sm font-semibold">Shop by need</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 hover:shadow-md">
              <span className="text-2xl" aria-hidden="true">{c.icon}</span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="hidden text-xs text-muted sm:block">{c.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {SHELVES.map((shelf, i) => (
        <div key={shelf.title}>
          <Shelf
            title={shelf.title}
            subtitle={shelf.subtitle}
            href={shelf.href}
            products={pickForShelf(all, shelf.slugs)}
            tint={shelf.tint}
          />
          {i === 2 && <CommunityStrip />}
        </div>
      ))}

      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-3 text-lg font-bold">More to explore</h2>
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
