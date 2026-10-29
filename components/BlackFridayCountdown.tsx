"use client";

import { useEffect, useState } from "react";
import { BF_END, BF_START, bfPhase } from "@/lib/blackfriday";

// Big boxes counting down to the start (or the end) of Black Friday, for the deals page.
export default function BlackFridayCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <div className="h-[88px]" aria-hidden="true" />;
  const phase = bfPhase(now);
  if (phase === "ended") return <p className="text-lg font-bold text-white">Black Friday has ended. Thank you for shopping with us!</p>;
  const ms = Math.max(0, new Date(phase === "before" ? BF_START : BF_END).getTime() - now);
  const s = Math.floor(ms / 1000);
  const boxes: [number, string][] = [[Math.floor(s / 86400), "Days"], [Math.floor((s % 86400) / 3600), "Hours"], [Math.floor((s % 3600) / 60), "Mins"], [s % 60, "Secs"]];
  return (
    <div role="timer" aria-label={phase === "before" ? "Time until Black Friday starts" : "Time left in Black Friday"}>
      <p className="mb-2 text-sm font-semibold text-white/80">{phase === "before" ? "Black Friday starts in" : "Black Friday ends in"}</p>
      <div className="flex gap-2 sm:gap-3">
        {boxes.map(([v, l]) => (
          <div key={l} className="w-16 rounded-lg bg-white/10 py-2 text-center sm:w-20">
            <div className="font-mono text-2xl font-black text-[#ffc83d] sm:text-3xl">{String(v).padStart(2, "0")}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
