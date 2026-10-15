import { supabase } from "@/lib/supabase";

// One row per product: who it came from and what it was first listed at. Admin-only in the
// database (docs/sql/product_sourcing.sql), so nothing here is ever public.
export interface SourcingRow {
  product_id: string;
  supplier: string;
  supplier_cost: number | null;
  listed_price: number;
  source_ref: string | null;
  listed_at: string;
}

export interface InventoryLine extends SourcingRow {
  name: string;
  slug: string;
  currentPrice: number;
  marginAtListing: number | null; // % over supplier cost when it was listed
  currentMargin: number | null; // % over supplier cost today
  priceChanged: boolean;
  flag: "below-cost" | "thin" | null;
}

export interface SupplierSummary {
  supplier: string;
  products: number;
  costTotal: number; // only products with a known cost
  listedTotal: number;
  listedWithCost: number; // listed value of the products whose cost is known
  avgMargin: number | null;
  changed: number;
  missingCost: number;
  flagged: number;
}

export const SETUP_NEEDED = "SETUP_NEEDED";
const THIN_MARGIN = 10; // % — below this the line is flagged for a pricing look

const pct = (price: number, cost: number | null) =>
  cost && cost > 0 ? Math.round(((price - cost) / cost) * 1000) / 10 : null;

export async function loadInventoryLines(): Promise<InventoryLine[]> {
  const [sourcing, products] = await Promise.all([
    supabase.from("product_sourcing").select("*"),
    supabase.from("products").select("id,name,slug,price"),
  ]);
  if (sourcing.error) {
    const code = (sourcing.error as { code?: string }).code;
    // 42P01 = table missing (Postgres), PGRST205 = table not in the API schema cache.
    if (code === "42P01" || code === "PGRST205" || /product_sourcing/.test(sourcing.error.message)) {
      throw new Error(SETUP_NEEDED);
    }
    throw new Error(sourcing.error.message);
  }
  if (products.error) throw new Error(products.error.message);

  const byId = new Map((products.data ?? []).map((p) => [p.id as string, p]));
  const lines: InventoryLine[] = [];
  for (const row of (sourcing.data ?? []) as SourcingRow[]) {
    const p = byId.get(row.product_id);
    if (!p) continue;
    const currentPrice = p.price as number;
    const currentMargin = pct(currentPrice, row.supplier_cost);
    let flag: InventoryLine["flag"] = null;
    if (row.supplier_cost && currentPrice < row.supplier_cost) flag = "below-cost";
    else if (currentMargin !== null && currentMargin < THIN_MARGIN) flag = "thin";
    lines.push({
      ...row,
      name: p.name as string,
      slug: p.slug as string,
      currentPrice,
      marginAtListing: pct(row.listed_price, row.supplier_cost),
      currentMargin,
      priceChanged: currentPrice !== row.listed_price,
      flag,
    });
  }
  return lines;
}

export function summarise(lines: InventoryLine[]): SupplierSummary[] {
  const map = new Map<string, InventoryLine[]>();
  for (const l of lines) map.set(l.supplier, [...(map.get(l.supplier) ?? []), l]);
  return Array.from(map, ([supplier, ls]) => {
    const withCost = ls.filter((l) => l.supplier_cost);
    const costTotal = withCost.reduce((s, l) => s + (l.supplier_cost ?? 0), 0);
    const listedWithCost = withCost.reduce((s, l) => s + l.listed_price, 0);
    return {
      supplier,
      products: ls.length,
      costTotal,
      listedTotal: ls.reduce((s, l) => s + l.listed_price, 0),
      listedWithCost,
      avgMargin: costTotal > 0 ? Math.round(((listedWithCost - costTotal) / costTotal) * 1000) / 10 : null,
      changed: ls.filter((l) => l.priceChanged).length,
      missingCost: ls.length - withCost.length,
      flagged: ls.filter((l) => l.flag).length,
    };
  }).sort((a, b) => b.products - a.products);
}

export function toCsv(lines: InventoryLine[]): string {
  const head = ["Product", "Supplier", "Listed on", "Supplier cost", "Listed price", "Current price", "Margin at listing %", "Current margin %", "Source"];
  const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = lines.map((l) =>
    [l.name, l.supplier, l.listed_at.slice(0, 10), l.supplier_cost, l.listed_price, l.currentPrice, l.marginAtListing, l.currentMargin, l.source_ref].map(esc).join(",")
  );
  return [head.map(esc).join(","), ...rows].join("\n");
}
