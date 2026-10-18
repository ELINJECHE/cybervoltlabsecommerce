"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKES } from "@/lib/format";
import { buildPhoneChatLink, normalizeKenyanPhone } from "@/lib/whatsapp";
import { toAdminMessage } from "@/lib/errors";
import {
  ORDERS_SETUP_NEEDED,
  ORDER_STATUSES,
  STATUS_LABELS,
  loadItemSuppliers,
  loadShopOrders,
  updateOrderStatus,
  type ItemSupplier,
  type OrderStatus,
  type ShopOrder,
} from "@/lib/admin-orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  awaiting_payment: "bg-border text-foreground",
  payment_claimed: "bg-deal-light text-deal-dark",
  paid: "bg-primary-light text-primary",
  dispatched: "bg-primary-light text-primary",
  delivered: "bg-success-light text-success",
  cancelled: "bg-border text-muted line-through",
};

function chatLink(phone: string | null, message?: string): string | null {
  const n = phone ? normalizeKenyanPhone(phone) : null;
  if (!n) return null;
  return message ? `${buildPhoneChatLink(n)}?text=${encodeURIComponent(message)}` : buildPhoneChatLink(n);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Map<string, ItemSupplier>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | "open" | "all">("open");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadShopOrders()
      .then(async (rows) => {
        setOrders(rows);
        setSuppliers(await loadItemSuppliers(rows.flatMap((o) => o.items.map((i) => i.productId))));
      })
      .catch((err: Error) => (err.message === ORDERS_SETUP_NEEDED ? setSetupNeeded(true) : setError(toAdminMessage(err, "CV-ADM-04"))))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, open: 0 };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
      if (o.status !== "delivered" && o.status !== "cancelled") c.open += 1;
    }
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === "open" && (o.status === "delivered" || o.status === "cancelled")) return false;
      if (filter !== "open" && filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [o.reference, o.customer_name, o.phone, ...o.items.map((i) => i.name)].some((v) => v.toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  async function changeStatus(order: ShopOrder, status: OrderStatus) {
    setSaving(order.id);
    setError(null);
    try {
      await updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch (err) {
      setError(toAdminMessage(err, "CV-ADM-01", "Couldn't update the order."));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading orders...</p>;

  if (setupNeeded) {
    return (
      <div className="max-w-xl rounded-card border border-border bg-surface p-5 text-sm">
        <h1 className="text-lg font-bold">One-time setup needed</h1>
        <p className="mt-2 text-muted">
          The orders table doesn&rsquo;t exist yet. In Supabase open <strong>SQL Editor → New query</strong>, paste the
          contents of <code>docs/sql/shop_orders.sql</code> and press <strong>Run</strong>. New checkouts appear here
          from then on. Older orders stay in the Google Sheet.
        </p>
      </div>
    );
  }

  const filters: { key: OrderStatus | "open" | "all"; label: string }[] = [
    { key: "open", label: "Open" },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Orders</h1>
      <p className="mb-4 text-sm text-muted">
        Every checkout, guest or logged in. Check &ldquo;Payment claimed&rdquo; codes against the Till before marking
        an order paid.
      </p>

      {error && <p className="mb-4 rounded-md bg-deal/10 px-3 py-2 text-sm text-deal">{error}</p>}

      <div className="mb-3 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f.key ? "border-primary bg-primary text-white" : "border-border hover:bg-primary-light"
            }`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search reference, customer, phone or product"
        className="mb-4 h-11 w-full max-w-md rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
      />

      {visible.length === 0 ? (
        <p className="text-sm text-muted">No orders here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((o) => {
            const customerChat = chatLink(o.phone, `Hi ${o.customer_name}, this is Cybervolt Labs about your order ${o.reference}.`);
            return (
              <article key={o.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold tracking-wide">{o.reference}</p>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                      {o.customer_id ? " · account customer" : " · guest"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                    <select
                      aria-label={`Change status of ${o.reference}`}
                      value={o.status}
                      disabled={saving === o.id}
                      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                      className="h-8 rounded-md border border-border bg-surface px-2 text-xs"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </header>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-muted">{o.phone}</p>
                    <p className="text-muted">{o.delivery_address}</p>
                    {customerChat && (
                      <a
                        href={customerChat}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                      >
                        💬 Chat with customer
                      </a>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <p>
                      Goods {formatKES(o.subtotal)} · Delivery{" "}
                      {o.pay_on_delivery ? "paid to courier" : formatKES(o.delivery_fee)}
                    </p>
                    <p className="text-base font-bold">Total {formatKES(o.total)}</p>
                    {o.mpesa_code && (
                      <p className="mt-1 text-xs">
                        M-Pesa <strong>{o.mpesa_code}</strong>
                        {o.paid_amount ? ` · ${formatKES(o.paid_amount)}` : ""}
                        {o.paid_from_phone ? ` · from ${o.paid_from_phone}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-border border-t border-border">
                  {o.items.map((item, idx) => {
                    const s = suppliers.get(item.productId);
                    const supplierChat = s
                      ? chatLink(
                          s.phone,
                          `Hi ${s.supplier}, this is Cybervolt Labs. I'd like to order ${item.quantity} x ${item.name}` +
                            `${item.color ? ` (${item.color})` : ""}. Is it available?`
                        )
                      : null;
                    return (
                      <li key={`${item.productId}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <div>
                          <p>
                            {item.quantity} × {item.name}
                            {item.color ? <span className="text-muted"> ({item.color})</span> : null}
                          </p>
                          <p className="text-xs text-muted">
                            {formatKES(item.unitPrice)} each ·{" "}
                            {s ? `Supplier: ${s.supplier}` : "Supplier not set"}
                          </p>
                        </div>
                        {supplierChat ? (
                          <a
                            href={supplierChat}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tap-target rounded-full bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                          >
                            💬 WhatsApp supplier
                          </a>
                        ) : (
                          <span className="text-xs text-muted">
                            {s ? "No supplier phone" : "Add supplier on the product"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
