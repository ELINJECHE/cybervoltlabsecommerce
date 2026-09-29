import Link from "next/link";

const TRENDING_SEARCHES = [
  "phone",
  "laptop",
  "led strip lights",
  "office chair",
  "helmet",
  "watch",
  "bluetooth speaker",
];

export default function HotSearchChips() {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1 pt-2 sm:px-0"
      aria-label="Trending searches"
    >
      {TRENDING_SEARCHES.map((term) => (
        <Link
          key={term}
          href={`/search?q=${encodeURIComponent(term)}`}
          className="tap-target flex shrink-0 items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
        >
          🔥 {term}
        </Link>
      ))}
    </div>
  );
}
