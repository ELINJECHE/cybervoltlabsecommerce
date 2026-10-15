"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface HeroSlide {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-7xl overflow-hidden sm:aspect-[12/5] sm:rounded-card">
      {slides.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            // Only the first slide is on screen at load; the others fetch when needed.
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-left sm:object-center"
          />

          {/* Mobile: the wide image crops tightly, so a scrim guarantees the
              bottom-anchored text stays legible regardless of what's cropped
              into view. Desktop: the image's own clean right-side space does
              that job, so no scrim is needed there. */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent sm:hidden"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:flex sm:w-1/2 sm:items-center sm:p-0">
            <div className="sm:w-full sm:pl-10 sm:pr-8">
              <h2 className="text-balance text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm text-muted sm:text-base">{slide.subtitle}</p>
              <Link
                href={slide.ctaHref}
                className="tap-target mt-4 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                {slide.ctaText}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
        aria-label="Previous slide"
        className="tap-target absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % slides.length)}
        aria-label="Next slide"
        className="tap-target absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-5 bg-primary" : "w-2 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
