import type { Metadata } from "next";
import type { Category, Product } from "@/lib/types";
import { SOCIAL_LINKS } from "@/lib/social";

export const SITE_URL = "https://cybervoltlabs.co.ke";
export const SITE_NAME = "Cybervolt Labs";
export const DEFAULT_TITLE = "Cybervolt Labs | Same-Day Delivery in Nairobi, Kenya";
export const DEFAULT_DESCRIPTION =
  "Same-day delivery in Nairobi. Shop motorcycle riding gear, sneakers, bedding, home décor and smart gadgets at Cybervolt Labs. Pay with M-Pesa.";

const TITLE_SUFFIX = ` | ${SITE_NAME}`;

// Used whenever a page has no image of its own (a page-level openGraph replaces the layout's).
const SHARE_IMAGE_ALT = "Cybervolt Labs — same-day delivery in Nairobi. Motorcycle gear, sneakers and home essentials. Pay with M-Pesa.";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, "") + "…";
}

const kes = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
const effectivePrice = (p: Product) => p.discountPrice ?? p.price;

// First candidate that still fits in ~60 characters once " | Cybervolt Labs" is added.
function fitTitle(candidates: string[], max = 60): string {
  return candidates.find((c) => c.length + TITLE_SUFFIX.length <= max) ?? candidates[candidates.length - 1];
}

// Keeps the closing line whole: tries the full one first, then shorter ones, and only
// shortens the main text as a last resort.
function composeDescription(main: string, tails: string[], max = 158): string {
  for (const tail of tails) {
    const full = `${main} ${tail}`;
    if (full.length <= max) return full;
  }
  const shortest = tails[tails.length - 1];
  return `${truncate(main, max - shortest.length - 1)} ${shortest}`;
}

function firstSentence(text: string): string {
  const match = text.trim().match(/^.+?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  images?: string[];
  absoluteTitle?: boolean;
}

// Open Graph / Twitter objects replace (not merge with) the layout's, so every page
// builds the full set here.
export function pageMetadata({ title, description, path, images, absoluteTitle }: PageMetaInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title}${TITLE_SUFFIX}`;
  const imageList = images?.map(absoluteUrl);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_KE",
      url: absoluteUrl(path),
      title: fullTitle,
      description,
      images: imageList?.length
        ? imageList.map((url) => ({ url }))
        : [{ url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: SHARE_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: imageList?.length ? imageList : [absoluteUrl("/twitter-image.png")],
    },
  };
}

export function productMetadata(product: Product): Metadata {
  const price = effectivePrice(product);
  const lead = product.description ? firstSentence(product.description) : "";
  const description = composeDescription(
    lead ? `${product.name}: ${lead} ${kes(price)}.` : `Buy ${product.name} online in Kenya for ${kes(price)}.`,
    ["Order from Cybervolt Labs: same-day delivery in Nairobi, pay with M-Pesa.", "Same-day Nairobi delivery; pay with M-Pesa.", "Pay with M-Pesa."]
  );
  return pageMetadata({
    // Long names lose their bracketed qualifier rather than being cut off mid-word.
    title: fitTitle([
      `${product.name} – ${kes(price)}`,
      product.name,
      product.name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim(),
    ]),
    description,
    path: `/product/${product.slug}`,
    images: product.images.filter((src) => !src.endsWith(".svg")).slice(0, 1),
  });
}

export function categoryMetadata(category: Category, products: Product[]): Metadata {
  const count = products.length;
  const prices = products.map(effectivePrice).sort((a, b) => a - b);
  const names = products.slice(0, 2).map((p) => p.name);
  const body =
    count > 0
      ? `Shop ${category.name} in Kenya: ${count} product${count === 1 ? "" : "s"} from ${kes(prices[0])}${
          names.length ? `, including ${names.join(" and ")}` : ""
        }. Same-day delivery in Nairobi; pay with M-Pesa.`
      : `Shop ${category.name} in Kenya at Cybervolt Labs. Same-day delivery in Nairobi; pay with M-Pesa.`;
  return pageMetadata({
    title: fitTitle([`${category.name} in Kenya`, category.name]),
    description: truncate(body, 158),
    path: `/category/${category.slug}`,
  });
}

// ---------------------------------------------------------------- structured data

const ORG_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/assets/images/logo-512.png"),
    description: DEFAULT_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Kenya" },
    address: { "@type": "PostalAddress", addressLocality: "Ongata Rongai", addressCountry: "KE" },
    ...(whatsapp
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: `+${whatsapp}`,
              areaServed: "KE",
              availableLanguage: ["English", "Swahili"],
            },
          ],
        }
      : {}),
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "en-KE",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: Product, categoryName?: string) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const price = effectivePrice(product);
  const refurbished = /refurb/i.test(product.name);
  const dealEnds =
    product.isDeal && product.dealEndsAt && new Date(product.dealEndsAt).getTime() > Date.now()
      ? product.dealEndsAt.slice(0, 10)
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description ?? `${product.name} from ${SITE_NAME}.`,
    sku: product.id,
    ...(categoryName ? { category: categoryName } : {}),
    image: product.images.map(absoluteUrl),
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "KES",
      price,
      availability: "https://schema.org/InStock",
      ...(refurbished ? { itemCondition: "https://schema.org/RefurbishedCondition" } : {}),
      ...(dealEnds ? { priceValidUntil: dealEnds } : {}),
      seller: { "@id": ORG_ID },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "KE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 2,
      },
    },
    ...(product.reviewCount > 0 && product.rating > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  };
}

export function categoryJsonLd(category: Category, products: Product[]) {
  const url = absoluteUrl(`/category/${category.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    url,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 50).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/product/${product.slug}`),
        name: product.name,
      })),
    },
  };
}
