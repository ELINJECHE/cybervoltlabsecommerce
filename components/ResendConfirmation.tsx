"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ErrorNotice from "@/components/ErrorNotice";
import { toAppError, type AppError } from "@/lib/errors";

// "Send me a new confirmation link" — for a link that expired, was already used, or (in early
// sign-ups) pointed at an address that doesn't open.
export default function ResendConfirmation({ initialEmail = "" }: { initialEmail?: string }) {
  const { resendConfirmation } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error } = await resendConfirmation(email.trim());
    setSending(false);
    if (error) {
      setError(toAppError(error, "CV-AUTH-03"));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-card border border-success/30 bg-success/5 p-3 text-sm text-success">
        New link sent to <strong>{email}</strong>. Open it on this phone or computer to finish. Check spam if it
        isn&rsquo;t there in a few minutes.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 text-sm">
      <label htmlFor="resend-email" className="font-medium">Send me a new confirmation link</label>
      <input
        id="resend-email"
        type="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
      />
      <ErrorNotice error={error} context="sending a confirmation link" />
      <button
        type="submit"
        disabled={sending}
        className="tap-target rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
      >
        {sending ? "Sending..." : "Send new link"}
      </button>
    </form>
  );
}
