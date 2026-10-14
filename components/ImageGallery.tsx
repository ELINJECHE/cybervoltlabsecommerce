"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImage } from "@/lib/images";

export default function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-primary-light">
        <Image
          src={getProductImage(images, active)}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 500px"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                i === active ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={image} alt={`${name} — photo ${i + 1}`} fill loading="lazy" sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
