import type { Metadata } from "next";
import type { Category, Product } from "@/lib/types";
import { SOCIAL_LINKS } from "@/lib/social";
import { DELIVERY_FEE, RETURN_DAYS } from "@/lib/delivery";
import { BF_END, bfPhase } from "@/lib/blackfriday";

export const SITE_URL = "https://cybervoltlabs.co.ke";
export const SITE_NAME = "Cybervolt Labs";
export const DEFAULT_TITLE = "Cybervolt Labs | Delivery Anywhere in Kenya, Pay on Delivery";
export const DEFAULT_DESCRIPTION =
  "Shop motorcycle riding gear, sneakers, bedding, home décor and smart gadgets at Cybervolt Labs. Delivery Ksh 999 anywhere in Kenya, 1-2 business days. Pay on delivery.";

const TITLE_SUFFIX = ` | ${SITE_NAME}`;

// Used whenever a page has no image of its own (a page-level openGraph replaces the layout's).
const SHARE_IMAGE_ALT = "Cybervolt Labs — motorcycle gear, sneakers and home essentials. Delivery anywhere in Kenya, pay on delivery.";

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
    ["Delivery Ksh 999 via Parcel Grid, 1-2 days, pay on delivery.", "Delivery Ksh 999, pay on delivery.", "Pay on delivery."]
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
  // What the category holds: its most common types if the products have them, otherwise a couple of names.
  const typeCounts = new Map<string, number>();
  for (const p of products) if (p.type) typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
  const types = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t.toLowerCase());
  const names = types.length >= 2 ? types : products.slice(0, 2).map((p) => p.name);
  const body =
    count > 0
      ? `Shop ${category.name} in Kenya: ${count} product${count === 1 ? "" : "s"} from ${kes(prices[0])}${
          names.length ? `, including ${names.length > 2 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names.join(" and ")}` : ""
        }. Delivery Ksh 999 anywhere in Kenya; pay on delivery.`
      : `Shop ${category.name} in Kenya at Cybervolt Labs. Delivery Ksh 999 anywhere in Kenya; pay on delivery.`;
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

function specValue(product: Product, label: string): string | undefined {
  return product.specs?.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value;
}

function colourOf(product: Product): string | undefined {
  return specValue(product, "Colour") ?? (product.colors && product.colors.length > 0 ? product.colors.map((c) => c.name).join(", ") : undefined);
}

export function productJsonLd(product: Product, categoryName?: string) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const price = effectivePrice(product);
  const onSale = product.discountPrice !== undefined && product.discountPrice < product.price;
  const dealEnds =
    product.isDeal && product.dealEndsAt && new Date(product.dealEndsAt).getTime() > Date.now()
      ? product.dealEndsAt.slice(0, 10)
      : undefined;
  // A sale needs an end date for Google: the deal's own end, or the Black Friday end while it is running.
  const saleEnds = dealEnds ?? (onSale && bfPhase() === "live" ? BF_END.slice(0, 10) : undefined);
  const condition = product.condition ?? (/refurb/i.test(product.name) ? "refurbished" : "new");
  const itemCondition = {
    new: "https://schema.org/NewCondition",
    used: "https://schema.org/UsedCondition",
    refurbished: "https://schema.org/RefurbishedCondition",
  }[condition];

  const offer = (offerUrl: string) => ({
    "@type": "Offer",
    url: offerUrl,
    priceCurrency: "KES",
    price, // what the customer pays today
    // The crossed-out price on the page, so Google sees both ("sale_price" in a feed).
    ...(onSale
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: product.price,
            priceCurrency: "KES",
          },
        }
      : {}),
    // -1 in the admin's Stock field = sold out.
    availability: product.stock < 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    itemCondition,
    ...(saleEnds ? { priceValidUntil: saleEnds } : {}),
    seller: { "@id": ORG_ID },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: DELIVERY_FEE, currency: "KES" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "KE" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "KE",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: RETURN_DAYS,
      returnMethod: "https://schema.org/ReturnInStore",
      returnFees: "https://schema.org/FreeReturn",
    },
  });

  const common = {
    "@context": "https://schema.org",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description ?? `${product.name} from ${SITE_NAME}.`,
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.gtin ? { gtin: product.gtin } : {}),
    // Colour and material as Google's own fields; every other spec as a named property.
    ...(colourOf(product) ? { color: colourOf(product) } : {}),
    ...(specValue(product, "Material") ? { material: specValue(product, "Material") } : {}),
    ...(product.sizes && product.sizes.length > 0 ? { size: product.sizes.join(", ") } : {}),
    ...(product.specs && product.specs.length > 0
      ? { additionalProperty: product.specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })) }
      : {}),
    ...(categoryName ? { category: categoryName } : {}),
    image: product.images.map(absoluteUrl),
    url,
    ...(product.reviewCount > 0 && product.rating > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
  };

  // Sizes: one product group, one variant per size (own SKU and offer), as Google expects for shoes.
  if (product.sizes && product.sizes.length > 0) {
    return {
      ...common,
      "@type": "ProductGroup",
      productGroupID: product.id,
      variesBy: "https://schema.org/size",
      hasVariant: product.sizes.map((size) => ({
        "@type": "Product",
        "@id": `${url}?size=${encodeURIComponent(size)}#product`,
        sku: `${product.id}-${size}`,
        name: `${product.name} - Size ${size}`,
        size,
        ...(product.mpn ? { mpn: product.mpn } : {}),
        image: product.images.map(absoluteUrl),
        offers: offer(`${url}?size=${encodeURIComponent(size)}`),
      })),
    };
  }

  return {
    ...common,
    "@type": "Product",
    sku: product.id,
    ...(product.mpn ? { mpn: product.mpn } : {}),
    offers: offer(url),
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
