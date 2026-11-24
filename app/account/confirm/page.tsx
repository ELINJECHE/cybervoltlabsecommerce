"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabaseEnabled } from "@/lib/supabase";
import ResendConfirmation from "@/components/ResendConfirmation";

// Where the "Confirm your email" link lands. Supabase signs the visitor in from the link itself
// (tokens in the address); a bad or expired link arrives with error details in the address instead.
function linkError(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
  return params.get("error_description") || params.get("error_code") || params.get("error");
}

export default function ConfirmEmailPage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setError(linkError());
    setChecked(true);
  }, []);

  if (!supabaseEnabled || !checked || (loading && !error)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Confirming your email…</h1>
      </div>
    );
  }

  if (user && !error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="text-4xl" aria-hidden="true">✅</span>
        <h1 className="mt-4 text-xl font-bold">Email confirmed</h1>
        <p className="mt-2 text-sm text-muted">Your account is ready and you&rsquo;re logged in.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="tap-target rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            Start shopping
          </Link>
          <Link href="/account" className="tap-target rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary">
            My account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-xl font-bold">{error ? "That link didn’t work" : "Confirm your email"}</h1>
      <p className="mb-6 text-sm text-muted">
        {error
          ? "Your confirmation link has expired or was already used. Already confirmed? Just log in. Otherwise, get a new link below."
          : "If you’ve already confirmed your email, log in. If your link didn’t open or has expired, get a new one below."}
      </p>
      <Link
        href="/account/login"
        className="tap-target mb-4 flex items-center justify-center rounded-full border border-primary py-3 text-sm font-semibold text-primary"
      >
        Log in
      </Link>
      <ResendConfirmation />
    </div>
  );
}
