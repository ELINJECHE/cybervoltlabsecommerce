"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOAST_EVENT } from "@/lib/toast";
import { BOTTOM_NAV_ENABLED } from "@/lib/community";

interface Toast { message: string; href?: string; linkLabel?: string }

export default function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setToast((e as CustomEvent<Toast>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 2800);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => { window.removeEventListener(TOAST_EVENT, onToast); clearTimeout(timer); };
  }, []);

  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed inset-x-0 z-[60] flex justify-center px-4 ${BOTTOM_NAV_ENABLED ? "bottom-20" : "bottom-6"} lg:bottom-6`}
    >
      <div className="flex animate-slide-up items-center gap-3 rounded-full bg-foreground px-4 py-2.5 text-sm text-white shadow-lg">
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
