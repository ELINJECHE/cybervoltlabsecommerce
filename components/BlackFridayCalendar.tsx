"use client";

import { useEffect, useState } from "react";
import { BF_WEEKS, currentWeek } from "@/lib/blackfriday";

const fmt = (d: string) => new Date(d + "T12:00:00+03:00").toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" });

// "Black Friday day by day": what each stretch of the month leads with. The current one is highlighted.
export default function BlackFridayCalendar() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setActive(currentWeek()?.from ?? null), []);
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {BF_WEEKS.map((w) => {
        const on = active === w.from;
        const big = w.title === "BLACK FRIDAY";
        return (
          <li key={w.from} className={`rounded-card border p-4 ${big ? "border-[#ffc83d] bg-[#07070d] text-white" : on ? "border-primary bg-primary-light" : "border-border bg-surface"}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${big ? "text-[#ffc83d]" : "text-primary"}`}>
              {w.from === w.to ? fmt(w.from) : `${fmt(w.from)} - ${fmt(w.to)}`}{on && " · NOW"}
            </p>
            <h3 className="mt-1 text-base font-bold">{w.title}</h3>
            <p className={`mt-1 text-sm ${big ? "text-white/80" : "text-muted"}`}>{w.blurb}</p>
          </li>
        );
      })}
    </ol>
  );
}
