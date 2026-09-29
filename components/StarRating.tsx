interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}

export default function StarRating({ rating, reviewCount, size = "sm" }: StarRatingProps) {
  const starSize = size === "sm" ? "text-xs" : "text-base";
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className={`flex items-center gap-1 ${starSize}`}>
      <div className="flex text-accent" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = rounded - i >= 1;
          const half = rounded - i === 0.5;
          return (
            <span key={i}>
              {filled ? "★" : half ? "⯨" : "☆"}
            </span>
          );
        })}
      </div>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      {reviewCount !== undefined && (
        <span className="text-muted">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
}
