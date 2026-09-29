export default function StockUrgencyBar({ claimedPercent }: { claimedPercent: number }) {
  const clamped = Math.min(Math.max(claimedPercent, 0), 100);

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-deal transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-medium text-deal">{clamped}% claimed</p>
    </div>
  );
}
