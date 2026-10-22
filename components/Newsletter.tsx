"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { EXCLUSIVE_GROUP_URL } from "@/lib/community";
import { LOYALTY_V2, WELCOME_AMOUNT, WELCOME_MIN_ORDER } from "@/lib/loyalty";
import { formatKES } from "@/lib/format";

// Footer box. With rewards on: the welcome voucher. Otherwise: the free WhatsApp group.
export default function Newsletter() {
  const { user, welcomeVoucher } = useAuth();

  if (!LOYALTY_V2) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-white">Get deals first</h3>
        <p className="mt-1 text-xs text-white/70">New arrivals and offers, straight to your phone.</p>
        <a
          href={EXCLUSIVE_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target mt-3 flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-foreground transition hover:brightness-95"
        >
          Join the free WhatsApp group
        </a>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{formatKES(WELCOME_AMOUNT)} off your first order</h3>
      <p className="mt-1 text-xs text-white/70">
        Create an account for a welcome voucher on a first order of {formatKES(WELCOME_MIN_ORDER)} or more, and earn points on every paid order.
      </p>
      {!user ? (
        <Link
          href="/account/signup"
          className="tap-target mt-3 flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-foreground transition hover:brightness-95"
        >
          Create an account
        </Link>
      ) : welcomeVoucher && !welcomeVoucher.used ? (
        <p className="mt-3 text-sm font-medium text-accent">
          Your {formatKES(welcomeVoucher.amount)} voucher is ready. Use it at checkout on a first order of {formatKES(welcomeVoucher.minOrder)} or more.
        </p>
      ) : (
        <p className="mt-3 text-sm font-medium text-accent">You&rsquo;re all set. Your points show in your account.</p>
      )}
    </div>
  );
}
