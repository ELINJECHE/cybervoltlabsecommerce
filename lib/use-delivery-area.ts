"use client";

import { useCallback, useEffect, useState } from "react";
import { NAIROBI_ZONES, OUTSIDE_NAIROBI_SLUG, type DeliveryZone } from "@/lib/delivery";

// The customer's chosen delivery area, remembered in the browser and shared between the top
// banner, product pages, the cart and checkout.
const KEY = "cv_area";
const EVENT = "cv-area-change";

export function useDeliveryArea() {
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const read = () => {
      try { setSlug(localStorage.getItem(KEY) ?? ""); } catch { /* storage blocked */ }
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const setArea = useCallback((next: string) => {
    try { localStorage.setItem(KEY, next); } catch { /* storage blocked */ }
    setSlug(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const zone: DeliveryZone | undefined = NAIROBI_ZONES.find((z) => z.slug === slug);
  return { slug, setArea, zone, outside: slug === OUTSIDE_NAIROBI_SLUG };
}
