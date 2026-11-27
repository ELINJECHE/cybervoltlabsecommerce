"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CART_TOAST_EVENT, TOAST_EVENT, type AddedToCart } from "@/lib/toast";

interface Toast { message: string; href?: string; linkLabel?: string }

const CART_TOAST_MS = 4000;

// Both messages sit above the bottom menu, the sticky buy bar and the floating Nami button
// (see --cv-nav-h / --cv-sticky-h in globals.css), so nothing is ever covered by them.
const STACK = "calc(var(--cv-nav-h) + env(safe-area-inset-bottom, 0px) + var(--cv-sticky-h) + 76px)";

export default function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [added, setAdded] = useState<AddedToCart | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setAdded(null);
      setToast((e as CustomEvent<Toast>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 2800);
    };
    const onAdded = (e: Event) => {
      setToast(null);
      setAdded((e as CustomEvent<AddedToCart>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setAdded(null), CART_TOAST_MS);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(CART_TOAST_EVENT, onAdded);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(CART_TOAST_EVENT, onAdded);
      clearTimeout(timer);
    };
  }, []);

  // Tapping anywhere outside the card closes it.
  useEffect(() => {
    if (!added) return;
    const outside = (e: Event) => {
      if (!cardRef.current?.contains(e.target as Node)) setAdded(null);
    };
    // Next tick, so the tap that added the item doesn't close its own message.
    const id = setTimeout(() => document.addEventListener("pointerdown", outside), 0);
    return () => { clearTimeout(id); document.removeEventListener("pointerdown", outside); };
  }, [added]);

  if (added) {
    return (
      <div role="status" style={{ bottom: STACK }} className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 lg:!bottom-6">
        <div
          ref={cardRef}
          className="pointer-events-auto flex w-full max-w-sm animate-slide-up flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-card"
        >
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-primary-light">
              <Image src={added.image} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-success">✓ Added to cart</p>
              <p className="line-clamp-1 text-xs text-muted">
                {added.count && added.count > 1 ? `${added.count} items` : added.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdded(null)}
              aria-label="Close"
              className="tap-target -mr-1 flex items-center justify-center px-2 text-lg text-muted"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2">
            <Link
              href="/cart"
              onClick={() => setAdded(null)}
              className="tap-target flex-1 rounded-full border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-light"
            >
              View cart
            </Link>
            <Link
              href="/checkout"
              onClick={() => setAdded(null)}
              className="tap-target flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!toast) return null;
  return (
    <div role="status" style={{ bottom: STACK }} className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 lg:!bottom-6">
      <div className="pointer-events-auto flex animate-slide-up items-center gap-3 rounded-full bg-foreground px-4 py-2.5 text-sm text-white shadow-lg">
        <span>{toast.message}</span>
        {toast.href && (
          <Link href={toast.href} className="font-semibold underline underline-offset-2">
            {toast.linkLabel ?? "View"}
          </Link>
        )}
      </div>
    </div>
  );
}
