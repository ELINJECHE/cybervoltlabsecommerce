import { EXCLUSIVE_GROUP_URL } from "@/lib/community";

// Black Friday theme. One switch turns the whole thing off; the dates make it start and end by
// themselves in the visitor's browser (no rebuild needed on the day).
export const BLACK_FRIDAY_THEME = true;

// Kenya time (UTC+3). "Black Friday" itself is Friday 27 November 2026; the month-long run
// matches how Jumia and Kilimall frame it.
export const BF_START = "2026-10-30T00:00:00+03:00";
export const BF_END = "2026-11-30T23:59:59+03:00";
export const BF_DAY = "2026-11-27T00:00:00+03:00";

export type BfPhase = "before" | "live" | "ended";

export function bfPhase(now = Date.now()): BfPhase {
  if (now < new Date(BF_START).getTime()) return "before";
  if (now > new Date(BF_END).getTime()) return "ended";
  return "live";
}

// Banner art. Placeholders are SVG (scripts/bf/make_art.py). To use a better image from an image app,
// save it under the same name with its real extension and change BF_ART_EXT.
// Sizes: hero 2400x1000 (desktop) and 1200x900 (phone); tiles 1200x600.
export const BF_ART_EXT = "webp";
const art = (name: string) => `/assets/images/bf/${name}.${BF_ART_EXT}`;

// Value-prop chips shown on the hero (each has a small icon). Keep them TRUE: they match the checkout and the returns page.
export type BfIcon = "truck" | "mpesa" | "return" | "bolt" | "tag";
export interface BfChip { icon: BfIcon; label: string }
const CHIPS: Record<string, BfChip> = {
  free: { icon: "truck", label: "Free delivery over KSh 5,000" },
  mpesa: { icon: "mpesa", label: "Pay with M-Pesa" },
  returns: { icon: "return", label: "48-hour returns" },
  sameday: { icon: "bolt", label: "Same-day in Nairobi" },
  real: { icon: "tag", label: "Real price cuts" },
};

// Heroes are ARTWORK ONLY (no text baked in): the site draws the headline, offer pill, value-prop chips and button on top, so
// the words are always sharp, correct and editable. Art sizes: desktop 2400x1000, phone 1200x900. Keep the LEFT HALF of the
// desktop art (and the TOP HALF of the phone art) calm and dark; put the mascot and products on the right (desktop) or bottom (phone).
export interface BfSlide {
  desktop: string; mobile: string; alt: string; href: string;
  kicker: string; headline: [string, string]; sub: string; cta: string; chips: BfChip[];
}
export const BF_SLIDES: BfSlide[] = [
  { desktop: art("hero-1"), mobile: art("hero-1-m"), alt: "Black Friday at Cybervolt Labs", href: "/black-friday",
    kicker: "BLACK FRIDAY", headline: ["Biggest Offers", "Ready to Drop"], sub: "Real price cuts. No inflated prices.", cta: "Shop Black Friday",
    chips: [CHIPS.free, CHIPS.mpesa, CHIPS.returns] },
  { desktop: art("hero-2"), mobile: art("hero-2-m"), alt: "Black Friday motorcycle gear", href: "/category/motorcycle-gear",
    kicker: "BLACK FRIDAY | RIDE READY", headline: ["Helmets, Jackets", "& Gloves"], sub: "Gear up for the road, delivered fast.", cta: "Shop Motorcycle Gear",
    chips: [CHIPS.sameday, CHIPS.free, CHIPS.returns] },
  { desktop: art("hero-3"), mobile: art("hero-3-m"), alt: "Black Friday home and bedding", href: "/category/interior-design",
    kicker: "BLACK FRIDAY | HOME", headline: ["Cosy Up", "This Season"], sub: "Bedding, curtains and kitchen finds.", cta: "Shop Home & Bedding",
    chips: [CHIPS.free, CHIPS.mpesa, CHIPS.sameday] },
];
export const BF_TILES = [
  { image: art("tile-calendar"), alt: "Black Friday day by day: see what drops each week", href: "/black-friday#calendar", external: false },
  { image: art("tile-whatsapp"), alt: "Get the drops first on our free WhatsApp group", href: EXCLUSIVE_GROUP_URL, external: true },
];

// "Day by day" calendar: each week leads with a different part of the shop. Deals are real price
// cuts set in the admin (discount price); this only decides what is highlighted first.
export interface BfWeek { from: string; to: string; title: string; blurb: string; categories: string[] }
export const BF_WEEKS: BfWeek[] = [
  { from: "2026-10-30", to: "2026-11-01", title: "Kick-off weekend", blurb: "Motorcycle gear leads the first drop", categories: ["motorcycle-gear"] },
  { from: "2026-11-02", to: "2026-11-08", title: "Home & Bedding week", blurb: "Duvets, curtains, mats and storage", categories: ["interior-design", "home-storage"] },
  { from: "2026-11-09", to: "2026-11-15", title: "Kitchen & Appliances week", blurb: "Cookers, blenders, fryers and cookware", categories: ["home-appliances", "kitchen-dining"] },
  { from: "2026-11-16", to: "2026-11-22", title: "Sound, Fitness & Outdoors week", blurb: "Speakers, home theatre, weights and camping", categories: ["audio-speakers", "electronics", "sports-leisure", "furniture"] },
  { from: "2026-11-23", to: "2026-11-26", title: "Gifts & Kids", blurb: "Sneakers, toys and gifts before the big day", categories: ["sneakers-shoes", "toy-shop", "fashion-accessories", "personal-care"] },
  { from: "2026-11-27", to: "2026-11-27", title: "BLACK FRIDAY", blurb: "The whole shop, all day", categories: [] },
  { from: "2026-11-28", to: "2026-11-30", title: "Cyber weekend", blurb: "Last chance on the best deals", categories: [] },
];

// Week containing a given moment (Kenya date), or null.
export function currentWeek(now = Date.now()): BfWeek | null {
  const day = new Date(now + 3 * 3600_000).toISOString().slice(0, 10);
  return BF_WEEKS.find((w) => day >= w.from && day <= w.to) ?? null;
}
