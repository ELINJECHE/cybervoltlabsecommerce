import type { Product } from "@/lib/types";

// Everything the category filters need: which filter groups to show for a list of products, and which products
// pass the filters the shopper has chosen. Pure functions, run in the browser.

export interface FacetOption {
  value: string;
  count: number;
}
export interface FacetGroup {
  label: string;
  options: FacetOption[];
}

export interface SelectedFilters {
  facets: Record<string, string[]>; // group label -> chosen values (any of them matches)
  priceMin: number;
  priceMax: number;
  inStock: boolean;
  onSale: boolean;
  newOnly: boolean;
  dealsOnly: boolean;
  minRating: number; // 0 = any
}

export const effectivePrice = (p: Product) => p.discountPrice ?? p.price;
export const isOnSale = (p: Product) => p.discountPrice !== undefined && p.discountPrice < p.price;

// The order groups appear in; anything else follows by how many products it covers.
const GROUP_ORDER = ["Type", "Brand", "Colour", "Condition"];

export function buildFacetGroups(products: Product[]): FacetGroup[] {
  const counts = new Map<string, Map<string, number>>();
  for (const p of products) {
    for (const [label, values] of Object.entries(p.facets ?? {})) {
      const m = counts.get(label) ?? new Map<string, number>();
      for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
      counts.set(label, m);
    }
  }
  const groups: FacetGroup[] = [];
  for (const [label, m] of Array.from(counts.entries())) {
    const options = Array.from(m.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, undefined, { numeric: true }));
    const covered = options.reduce((n, o) => n + o.count, 0);
    // A filter that cannot narrow anything down (hardly any products have it, or every product has the same value)
    // is just clutter. A single value that only some products have (Connectivity: Bluetooth) is a useful yes/no filter.
    const singleButUseful = options.length === 1 && covered < products.length * 0.9;
    if ((options.length < 2 && !singleButUseful) || options.length > 40 || covered < 3) continue;
    groups.push({ label, options });
  }
  const rank = (l: string) => (GROUP_ORDER.includes(l) ? GROUP_ORDER.indexOf(l) : GROUP_ORDER.length);
  const total = (g: FacetGroup) => g.options.reduce((n, o) => n + o.count, 0);
  return groups.sort((a, b) => rank(a.label) - rank(b.label) || total(b) - total(a));
}

export interface FilterAvailability {
  maxPrice: number;
  minPrice: number;
  anyOnSale: boolean;
  anyNew: boolean;
  anyDeal: boolean;
  anySoldOut: boolean;
  anyRated: boolean;
}

export function availability(products: Product[]): FilterAvailability {
  const prices = products.map(effectivePrice);
  return {
    maxPrice: Math.max(...prices, 1000),
    minPrice: Math.min(...prices, 0),
    anyOnSale: products.some(isOnSale),
    anyNew: products.some((p) => p.isNewArrival),
    anyDeal: products.some((p) => p.isDeal),
    anySoldOut: products.some((p) => p.stock < 0),
    anyRated: products.some((p) => p.reviewCount > 0 && p.rating > 0),
  };
}

export function emptyFilters(a: FilterAvailability): SelectedFilters {
  return { facets: {}, priceMin: 0, priceMax: a.maxPrice, inStock: false, onSale: false, newOnly: false, dealsOnly: false, minRating: 0 };
}

export function applyFilters(products: Product[], s: SelectedFilters): Product[] {
  return products.filter((p) => {
    const price = effectivePrice(p);
    if (price < s.priceMin || price > s.priceMax) return false;
    if (s.inStock && p.stock < 0) return false;
    if (s.onSale && !isOnSale(p)) return false;
    if (s.newOnly && !p.isNewArrival) return false;
    if (s.dealsOnly && !p.isDeal) return false;
    if (s.minRating > 0 && !(p.reviewCount > 0 && p.rating >= s.minRating)) return false;
    for (const [label, chosen] of Object.entries(s.facets)) {
      if (chosen.length === 0) continue;
      const have = p.facets?.[label] ?? [];
      if (!chosen.some((c) => have.includes(c))) return false;
    }
    return true;
  });
}

// Quick price bands that suit the category: round numbers that split its products into useful groups.
export function priceBands(products: Product[]): { label: string; min: number; max: number }[] {
  const prices = products.map(effectivePrice).sort((a, b) => a - b);
  if (prices.length < 6) return [];
  const nice = (n: number) => {
    const step = n < 2000 ? 100 : n < 10000 ? 500 : 1000;
    return Math.max(step, Math.round(n / step) * step);
  };
  const cuts = Array.from(new Set([0.25, 0.5, 0.75].map((q) => nice(prices[Math.floor(q * (prices.length - 1))]))));
  if (cuts.length < 2) return [];
  const fmt = (n: number) => n.toLocaleString("en-KE");
  const bands: { label: string; min: number; max: number }[] = [{ label: `Under ${fmt(cuts[0])}`, min: 0, max: cuts[0] }];
  for (let i = 1; i < cuts.length; i++) bands.push({ label: `${fmt(cuts[i - 1])} – ${fmt(cuts[i])}`, min: cuts[i - 1], max: cuts[i] });
  bands.push({ label: `Over ${fmt(cuts[cuts.length - 1])}`, min: cuts[cuts.length - 1], max: Number.MAX_SAFE_INTEGER });
  return bands;
}
