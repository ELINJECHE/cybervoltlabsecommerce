"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toAppError, type AppError } from "@/lib/errors";

type Status = "idle" | "already-subscribed" | "subscribed-with-points" | "error";

export default function Newsletter() {
  const { user, claimNewsletterPoints } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return; // guests see the login/signup prompt instead of this form
    setSubmitting(true);
    const { error, newlyAwarded } = await claimNewsletterPoints();
    setSubmitting(false);
    if (error) {
      setError(toAppError(error, "CV-NET-01"));
      setStatus("error");
      return;
    }
    setStatus(newlyAwarded ? "subscribed-with-points" : "already-subscribed");
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">Get deals in your inbox</h3>
      <p className="mt-1 text-xs text-white/70">
        No spam, just restocks and flash deals — plus 100 points for subscribing.
      </p>

      {!user ? (
        <p className="mt-3 text-sm text-white/80">
          <Link href="/account/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>{" "}
          (or{" "}
          <Link href="/account/login" className="font-medium text-accent hover:underline">
            log in
          </Link>
          ) to subscribe and claim your 100 points.
        </p>
      ) : status === "subscribed-with-points" ? (
        <p className="mt-3 text-sm font-medium text-accent">
          You&rsquo;re subscribed — 100 points added to your account!
        </p>
      ) : status === "already-subscribed" ? (
        <p className="mt-3 text-sm font-medium text-accent">
          You&rsquo;re already subscribed — that bonus is one-time per account.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3">
          {status === "error" && error && (
            <p className="mb-2 text-xs text-deal">{error.message}{error.code ? ` (${error.code})` : ""}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="tap-target h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Subscribing..." : "Subscribe & Claim 100 Points"}
          </button>
        </form>
      )}
    </div>
  );
}
