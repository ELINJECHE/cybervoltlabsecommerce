import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-3 text-lg font-bold">Shop by Category</h2>
      <div className="relative flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="tap-target flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-24"
          >
            <span className="relative block h-16 w-16 overflow-hidden rounded-full border border-border bg-primary-light sm:h-20 sm:w-20">
              <Image
                src={category.image || "/assets/images/no-image-placeholder.svg"}
                alt={category.name}
                fill
                loading="lazy"
                sizes="80px"
                className="object-cover"
              />
            </span>
            <span className="line-clamp-2 text-xs font-medium leading-tight">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
