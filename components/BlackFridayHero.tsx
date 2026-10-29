"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BF_SLIDES, type BfIcon } from "@/lib/blackfriday";

function Icon({ name }: { name: BfIcon }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true" {...p}>
      {name === "truck" && <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>}
      {name === "mpesa" && <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M10 6h4M12 18h.01M9.5 11l2.5 3 2.5-3" /></>}
      {name === "return" && <><path d="M4 12a8 8 0 1 0 2.6-5.9" /><path d="M4 4v4h4" /></>}
      {name === "bolt" && <path d="M13 2 4 14h6l-1 8 9-12h-6z" />}
      {name === "tag" && <><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></>}
    </svg>
  );
}

// Homepage hero while Black Friday runs, in the style of Jumia/Kilimall's: a gold "BLACK FRIDAY" mark and date, a big headline, an
// offer pill, value-prop chips with icons, and a button, all drawn by the site over ARTWORK-ONLY images (see lib/blackfriday.ts).
// `maxOff` is the biggest real discount currently set in the shop; without one the pill says "Real price cuts".
export default function BlackFridayHero({ maxOff = 0 }: { maxOff?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setI((v) => (v + 1) % BF_SLIDES.length); }, 6500);
    return () => clearInterval(id);
  }, []);
  const pill = maxOff >= 5 ? `Up to ${maxOff}% off` : "Real price cuts";

  return (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden bg-[#07070d] sm:rounded-card" aria-roledescription="carousel" aria-label="Black Friday offers">
      <div className="relative aspect-[12/17] sm:aspect-[12/5]">
        {BF_SLIDES.map((s, n) => (
          <div key={s.href + n} aria-hidden={n !== i}
            className={`absolute inset-0 transition-opacity duration-500 ${n === i ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <Image src={s.mobile} alt="" fill priority={n === 0} sizes="100vw" className="object-cover object-bottom sm:hidden" />
            <Image src={s.desktop} alt="" fill priority={n === 0} sizes="(min-width: 1280px) 1280px, 100vw" className="hidden object-cover sm:block" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07070d]/90 via-[#07070d]/45 to-transparent sm:bg-gradient-to-r sm:from-[#07070d]/95 sm:via-[#07070d]/60 sm:to-transparent" aria-hidden="true" />

            <div className="absolute inset-0 flex flex-col justify-start gap-2 p-5 text-white sm:w-[58%] sm:justify-center sm:gap-3 sm:p-10">
              <div className="flex items-center gap-2">
                <Image src="/assets/images/logo-128.png" alt="" width={28} height={28} className="h-7 w-7 rounded" />
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wide sm:text-xs">• 30 OCT - 30 NOV</span>
              </div>
              <p className="bg-gradient-to-r from-[#ffc83d] to-[#ffe9a8] bg-clip-text text-xl font-black tracking-wide text-transparent sm:text-3xl lg:text-4xl">{s.kicker}</p>
              <h2 className="text-balance text-3xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">
                {s.headline[0]}<br />{s.headline[1]}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-[#07070d] sm:text-lg">{pill}</span>
                <span className="text-xs font-medium text-white/80 sm:text-sm">{s.sub}</span>
              </div>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
                {s.chips.map((c, k) => (
                  <li key={c.label} className={`flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${k === 2 ? "hidden sm:flex" : ""}`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5de7a4]/60 text-[#5de7a4]"><Icon name={c.icon} /></span>
                    <span className="max-w-[9rem] leading-tight">{c.label}</span>
                  </li>
                ))}
              </ul>
              <Link href={s.href} tabIndex={n === i ? 0 : -1} aria-label={`${s.cta}`}
                className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#5de7a4] px-6 py-2.5 text-sm font-black text-[#07070d] hover:brightness-95 sm:text-base">
                {s.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <button type="button" aria-label="Previous slide" onClick={() => setI((v) => (v - 1 + BF_SLIDES.length) % BF_SLIDES.length)}
        className="tap-target absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:flex">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
      </button>
      <button type="button" aria-label="Next slide" onClick={() => setI((v) => (v + 1) % BF_SLIDES.length)}
        className="tap-target absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:flex">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
      </button>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
        {BF_SLIDES.map((_, n) => (
          <button key={n} type="button" aria-label={`Show slide ${n + 1}`} onClick={() => setI(n)}
            className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-[#5de7a4]" : "w-2 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
