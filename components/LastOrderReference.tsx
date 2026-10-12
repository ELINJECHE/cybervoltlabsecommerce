"use client";

import { useEffect, useState } from "react";
import { LAST_ORDER_REF_KEY } from "@/lib/orders";

export default function LastOrderReference() {
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReference(sessionStorage.getItem(LAST_ORDER_REF_KEY));
    } catch {
      setReference(null);
    }
  }, []);

  if (!reference) return null;

  return (
    <p className="mt-3 text-sm text-muted">
      Order reference: <strong className="text-foreground">{reference}</strong>
    </p>
  );
}
