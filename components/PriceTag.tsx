import { formatKES, percentOff } from "@/lib/format";

interface PriceTagProps {
  price: number;
  discountPrice?: number;
  size?: "sm" | "lg";
}

export default function PriceTag({ price, discountPrice, size = "sm" }: PriceTagProps) {
  const hasDiscount = discountPrice !== undefined && discountPrice < price;
  const priceClass = size === "lg" ? "text-2xl font-bold" : "text-base font-semibold";

  if (!hasDiscount) {
    return <span className={priceClass}>{formatKES(price)}</span>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={priceClass}>{formatKES(discountPrice!)}</span>
      <span className="text-muted line-through text-sm">{formatKES(price)}</span>
      <span className="rounded bg-deal/10 px-1.5 py-0.5 text-xs font-semibold text-deal">
        -{percentOff(price, discountPrice!)}%
      </span>
    </div>
  );
}
