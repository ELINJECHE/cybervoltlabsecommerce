"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/format";
import {
  SETUP_NEEDED,
  loadInventoryLines,
  summarise,
  toCsv,
  type InventoryLine,
} from "@/lib/admin-sourcing";

type Sort = "margin" | "newest" | "price";

const pctText = (v: number | null) => (v === null ? "—" : `${v}%`);

export default function InventoryPage() {
  const [lines, setLines] = useState<InventoryLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [supplier, setSupplier] = useState("all");
  const [sort, setSort] = useState<Sort>("margin");
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  useEffect(() => {
    loadInventoryLines()
      .then(setLines)
      .catch((err: Error) => (err.message === SETUP_NEEDED ? setSetupNeeded(true) : setError(err.message)))
      .finally(() => setLoading(false));
  }, []);

  const summaries = useMemo(() => summarise(lines), [lines]);
  const totals = useMemo(() => {
    const withCost = lines.filter((l) => l.supplier_cost);
    const cost = withCost.reduce((s, l) => s + (l.supplier_cost ?? 0), 0);
    const listed = withCost.reduce((s, l) => s + l.listed_price, 0);
    return {
      products: lines.length,
      listedValue: lines.reduce((s, l) => s + l.listed_price, 0),
      cost,
      avgMargin: cost > 0 ? Math.round(((listed - cost) / cost) * 1000) / 10 : null,
      flagged: lines.filter((l) => l.flag).length,
      changed: lines.filter((l) => l.priceChanged).length,
    };
  }, [lines]);

  const visible = useMemo(() => {
    let out = lines.filter((l) => (supplier === "all" || l.supplier === supplier) && (!onlyFlagged || l.flag));
    out = [...out].sort((a, b) => {
      if (sort === "newest") return b.listed_at.localeCompare(a.listed_at);
      if (sort === "price") return b.currentPrice - a.currentPrice;
      // Lowest margin first (unknown cost last) so pricing problems surface at the top.
      return (a.currentMargin ?? 1e9) - (b.currentMargin ?? 1e9);
    });
    return out;
  }, [lines, supplier, sort, onlyFlagged]);

  function downloadCsv() {
    const blob = new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-sources.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-sm text-muted">Loading inventory sources...</p>;

  if (setupNeeded) {
    return (
      <div className="rounded-card border border-border bg-surface p-5 text-sm">
        <h1 className="mb-2 text-lg font-bold">One-time setup needed</h1>
        <p className="text-muted">
          This page needs a small admin-only table in Supabase that remembers which supplier each product came
          from and what it was listed at. Open <strong>Supabase → SQL Editor → New query</strong>, paste the contents
          of <code className="rounded bg-background px-1">docs/sql/product_sourcing.sql</code> from the project, press
          Run, then reload this page.
        </p>
      </div>
    );
  }

  if (error) return <p className="rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-bold">Inventory &amp; pricing</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Where each product came from and what it was listed at. Supplier costs are visible to admins only. Change a
        price in{" "}
        <Link href="/admin" className="font-medium text-primary hover:underline">
          Products
        </Link>
        .
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Products tracked", value: String(totals.products) },
          { label: "Listed value (at listing)", value: formatKES(totals.listedValue) },
          { label: "Known supplier cost", value: totals.cost ? formatKES(totals.cost) : "—" },
          { label: "Avg margin at listing", value: pctText(totals.avgMargin) },
          { label: "Need a pricing look", value: String(totals.flagged), warn: totals.flagged > 0 },
        ].map((c) => (
          <div key={c.label} className="rounded-card border border-border bg-surface p-3">
            <p className="text-xs text-muted">{c.label}</p>
            <p className={`mt-1 text-lg font-bold ${c.warn ? "text-deal" : ""}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-base font-bold">By supplier</h2>
      <div className="mb-8 overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2 text-right">Products</th>
              <th className="px-3 py-2 text-right">Supplier cost</th>
              <th className="px-3 py-2 text-right">Listed value</th>
              <th className="px-3 py-2 text-right">Avg margin</th>
              <th className="px-3 py-2 text-right">Price changed</th>
              <th className="px-3 py-2 text-right">Cost unknown</th>
              <th className="px-3 py-2 text-right">Flagged</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr
                key={s.supplier}
                onClick={() => setSupplier(supplier === s.supplier ? "all" : s.supplier)}
                className={`cursor-pointer border-b border-border last:border-0 hover:bg-background ${supplier === s.supplier ? "bg-primary-light" : ""}`}
              >
                <td className="px-3 py-2 font-medium">{s.supplier}</td>
                <td className="px-3 py-2 text-right">{s.products}</td>
                <td className="px-3 py-2 text-right">{s.costTotal ? formatKES(s.costTotal) : "—"}</td>
                <td className="px-3 py-2 text-right">{formatKES(s.listedTotal)}</td>
                <td className="px-3 py-2 text-right">{pctText(s.avgMargin)}</td>
                <td className="px-3 py-2 text-right">{s.changed}</td>
                <td className="px-3 py-2 text-right">{s.missingCost}</td>
                <td className={`px-3 py-2 text-right ${s.flagged ? "font-semibold text-deal" : ""}`}>{s.flagged}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-base font-bold">
          Products{supplier !== "all" ? ` from ${supplier}` : ""} ({visible.length})
        </h2>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          Only flagged
        </label>
        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
          aria-label="Supplier"
        >
          <option value="all">All suppliers</option>
          {summaries.map((s) => (
            <option key={s.supplier} value={s.supplier}>
              {s.supplier}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
          aria-label="Sort"
        >
          <option value="margin">Lowest margin first</option>
          <option value="newest">Newest first</option>
          <option value="price">Highest price first</option>
        </select>
        <button
          type="button"
          onClick={downloadCsv}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-background"
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Listed on</th>
              <th className="px-3 py-2 text-right">Supplier cost</th>
              <th className="px-3 py-2 text-right">Listed at</th>
              <th className="px-3 py-2 text-right">Price now</th>
              <th className="px-3 py-2 text-right">Margin now</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr key={l.product_id} className="border-b border-border last:border-0">
                <td className="max-w-[18rem] px-3 py-2">
                  <Link href={`/admin/products/${l.product_id}/edit`} className="line-clamp-2 font-medium text-primary hover:underline">
                    {l.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{l.supplier}</td>
                <td className="px-3 py-2 text-muted">{l.listed_at.slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">{l.supplier_cost ? formatKES(l.supplier_cost) : "—"}</td>
                <td className="px-3 py-2 text-right">{formatKES(l.listed_price)}</td>
                <td className="px-3 py-2 text-right">
                  {formatKES(l.currentPrice)}
                  {l.priceChanged && <span className="ml-1 text-xs text-muted">(changed)</span>}
                </td>
                <td
                  className={`px-3 py-2 text-right ${
                    l.flag === "below-cost" ? "font-semibold text-deal" : l.flag === "thin" ? "font-semibold text-secondary" : ""
                  }`}
                >
                  {pctText(l.currentMargin)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {l.flag === "below-cost" && <span className="rounded bg-deal/10 px-1.5 py-0.5 text-deal">Below cost</span>}
                  {l.flag === "thin" && <span className="rounded bg-secondary-light px-1.5 py-0.5 text-secondary">Thin margin</span>}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted">
                  Nothing to show for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        Margin = (price − supplier cost) ÷ supplier cost. &ldquo;Thin&rdquo; means under 10%. Products from your own
        broadcast group show no cost because only the retail price was posted.
      </p>
    </div>
  );
}
