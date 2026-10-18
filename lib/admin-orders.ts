import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/lib/cart-context";

// The shop's order book (docs/sql/shop_orders.sql): every checkout, guest or
// logged in. Readable by admins only.
export const ORDER_STATUSES = [
  "awaiting_payment",
  "payment_claimed",
  "paid",
  "dispatched",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  payment_claimed: "Payment claimed – check Till",
  paid: "Paid",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface ShopOrder {
  id: string;
  reference: string;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  delivery_address: string;
  delivery_area: string | null;
  delivery_fee: number;
  pay_on_delivery: boolean;
  subtotal: number;
  total: number;
  items: CartItem[];
  notes: string | null;
  status: OrderStatus;
  mpesa_code: string | null;
  paid_amount: number | null;
  paid_from_phone: string | null;
  created_at: string;
}

export interface ItemSupplier {
  supplier: string;
  phone: string | null;
}

export const ORDERS_SETUP_NEEDED = "ORDERS_SETUP_NEEDED";

export async function loadShopOrders(): Promise<ShopOrder[]> {
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    const code = (error as { code?: string }).code;
    // 42P01 = table missing (Postgres), PGRST205 = table not in the API schema cache.
    if (code === "42P01" || code === "PGRST205" || /shop_orders/.test(error.message)) {
      throw new Error(ORDERS_SETUP_NEEDED);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as ShopOrder[];
}

// Supplier name + phone per product id, from the admin-only sourcing table.
// Empty when that table isn't set up yet: orders still show, just without suppliers.
export async function loadItemSuppliers(productIds: string[]): Promise<Map<string, ItemSupplier>> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  const map = new Map<string, ItemSupplier>();
  if (ids.length === 0) return map;
  const { data, error } = await supabase
    .from("product_sourcing")
    .select("product_id, supplier, supplier_phone")
    .in("product_id", ids);
  if (error || !data) return map;
  for (const row of data) {
    map.set(row.product_id as string, {
      supplier: row.supplier as string,
      phone: (row.supplier_phone as string | null) ?? null,
    });
  }
  return map;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from("shop_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
