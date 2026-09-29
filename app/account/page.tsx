"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { formatKES } from "@/lib/format";

interface OrderRow {
  id: string;
  status: string;
  subtotal: number;
  created_at: string;
}

export default function AccountPage() {
  const { user, loading, isAdmin, pointsBalance, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!supabaseEnabled || !user) return;
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

      <div className="mb-6 rounded-card border border-success/30 bg-success-light p-5">
        <p className="text-sm font-medium text-muted">Your points balance</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{pointsBalance.toLocaleString()} pts</p>
        <p className="mt-1 text-xs text-muted">
          Worth {formatKES(pointsBalance * 10)} &middot; 5 points per KES 1,000 spent, credited once
          we confirm payment on an order.
        </p>
      </div>

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
                  order.status === "confirmed"
                    ? "bg-success/10 text-success"
                    : order.status === "cancelled"
                      ? "bg-deal/10 text-deal"
                      : "bg-secondary-light text-secondary"
                }`}
              >
                {order.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
