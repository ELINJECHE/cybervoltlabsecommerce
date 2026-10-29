import Image from "next/image";
import Link from "next/link";
import { BF_TILES } from "@/lib/blackfriday";

// Two promo tiles side by side (calendar + free WhatsApp group), like Jumia's banner pairs.
export default function BlackFridayTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-3" aria-label="Black Friday promotions">
      <div className="grid gap-3 sm:grid-cols-2">
        {BF_TILES.map((t) => {
          const img = <Image src={t.image} alt={t.alt} width={1200} height={600} sizes="(min-width: 1280px) 620px, 50vw" className="h-auto w-full rounded-card" />;
          return t.external
            ? <a key={t.href} href={t.href} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-card hover:opacity-95">{img}</a>
            : <Link key={t.href} href={t.href} className="block overflow-hidden rounded-card hover:opacity-95">{img}</Link>;
        })}
      </div>
    </section>
  );
}
