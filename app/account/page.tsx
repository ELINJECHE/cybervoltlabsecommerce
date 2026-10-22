"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { formatKES } from "@/lib/format";
import { LOYALTY_V2, REDEEM_CAP_MAX, REDEEM_MIN, TIER_THRESHOLD } from "@/lib/loyalty";

interface OrderRow {
  id: string;
  status: string;
  subtotal: number;
  created_at: string;
}

export default function AccountPage() {
  const { user, loading, isAdmin, pointsBalance, welcomeVoucher, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!supabaseEnabled || !user) return;
    // With rewards on, orders come from the shop's order book (customers can read only their own).
    if (LOYALTY_V2) {
      supabase
        .from("shop_orders")
        .select("id, status, total, created_at")
        .order("created_at", { ascending: false })
        .then(({ data }) => setOrders((data ?? []).map((o) => ({ id: o.id, status: o.status, subtotal: o.total, created_at: o.created_at }))));
      return;
    }
    supabase
      .from("orders")
      .select("id, status, subtotal, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (!supabaseEnabled) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Accounts coming soon</h1>
        <p className="mt-2 text-sm text-muted">
          Customer accounts and loyalty points are being set up — check back shortly.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">You&rsquo;re not logged in</h1>
        <p className="mt-2 text-sm text-muted">Log in to view your points balance and orders.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/login" className="tap-target rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            Log In
          </Link>
          <Link href="/account/signup" className="tap-target rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-light">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Account</h1>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="tap-target text-sm font-medium text-muted hover:text-deal"
          >
            Log out
          </button>
        </div>
      </div>

      {LOYALTY_V2 && (
        <>
          {welcomeVoucher && (
            <div className="mb-4 rounded-card border border-primary/30 bg-primary/5 p-5">
              <p className="text-sm font-medium text-muted">Welcome voucher</p>
              {welcomeVoucher.used ? (
                <p className="mt-1 text-sm">Your voucher has been used. Thanks for your first order!</p>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-primary">{formatKES(welcomeVoucher.amount)} off</p>
                  <p className="mt-1 text-xs text-muted">
                    On your first order with items worth {formatKES(welcomeVoucher.minOrder)} or more. It&rsquo;s applied at checkout.
                  </p>
                </>
              )}
            </div>
          )}
          <div className="mb-6 rounded-card border border-success/30 bg-success-light p-5">
            <p className="text-sm font-medium text-muted">Your points balance</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{pointsBalance.toLocaleString()} pts</p>
            <p className="mt-1 text-xs text-muted">
              Worth {formatKES(pointsBalance)} &middot; 1 point = KSh 1. Paid orders earn 1% back, or 1.5% from {formatKES(TIER_THRESHOLD)},
              credited once we confirm payment. Use at least {REDEEM_MIN} points at checkout, up to 10% of an order (max {formatKES(REDEEM_CAP_MAX)}).
            </p>
          </div>
        </>
      )}

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted">No orders placed while logged in yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between rounded-card border border-border bg-surface p-3 text-sm"
            >
              <div>
                <p className="font-medium">{formatKES(order.subtotal)}</p>
                <p className="text-xs text-muted">
                  {new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                  order.status === "confirmed" || order.status === "paid" || order.status === "delivered"
                    ? "bg-success/10 text-success"
                    : order.status === "cancelled"
                      ? "bg-deal/10 text-deal"
                      : "bg-secondary-light text-secondary"
                }`}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
