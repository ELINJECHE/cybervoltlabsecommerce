"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BF_END, BF_START, BLACK_FRIDAY_THEME, bfPhase } from "@/lib/blackfriday";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

// Slim black strip above everything: a live countdown to the start (or end) of Black Friday and a link to the
// deals page. Disappears by itself after the campaign.
export default function BlackFridayStrip() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!BLACK_FRIDAY_THEME) return null;
  const phase = now === null ? "before" : bfPhase(now);
  if (phase === "ended") return null;

  const target = new Date(phase === "before" ? BF_START : BF_END).getTime();
  const t = now === null ? null : parts(target - now);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Link href="/black-friday" className="block bg-[#07070d] px-4 py-2 text-white hover:bg-black" aria-label="Black Friday deals">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm">
        <span className="font-black tracking-widest text-[#ffc83d]">BLACK FRIDAY</span>
        <span className="hidden font-semibold sm:inline">Biggest offers ready to drop</span>
        {t && (
          <span className="flex items-center gap-1 font-mono text-xs font-bold" role="timer" aria-label={phase === "before" ? "Time until Black Friday starts" : "Time left in Black Friday"}>
            <span className="font-sans font-semibold text-white/80">{phase === "before" ? "Starts in" : "Ends in"}</span>
            {[[t.d, "d"], [pad(t.h), "h"], [pad(t.m), "m"], [pad(t.s), "s"]].map(([v, u]) => (
              <span key={u as string} className="rounded bg-white/15 px-1.5 py-0.5">{v}{u}</span>
            ))}
          </span>
        )}
        <span className="rounded-full bg-[#5de7a4] px-3 py-0.5 text-[11px] font-black text-[#07070d]">See the deals →</span>
      </div>
    </Link>
  );
}
