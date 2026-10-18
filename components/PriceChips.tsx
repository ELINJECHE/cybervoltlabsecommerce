import Link from "next/link";
import { formatKES } from "@/lib/format";
import { PRICE_STEPS } from "@/lib/price-steps";

// "What can I get for KSh ___?" shortcuts to the budget pages.
export default function PriceChips() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4" aria-label="Shop by budget">
      <p className="mb-2 text-sm font-semibold">Shop by budget</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {PRICE_STEPS.map((p) => (
          <Link
            key={p}
            href={`/under/${p}`}
            className="tap-target shrink-0 rounded-full border border-primary bg-surface px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
          >
            Under {formatKES(p)}
          </Link>
        ))}
      </div>
    </section>
  );
}
