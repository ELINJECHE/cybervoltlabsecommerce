// Shown while the saved cart is being read from this browser, so "Your cart is empty" never flashes.
export default function CartSkeleton({ title = "Your Cart" }: { title?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6" role="status" aria-busy="true" aria-label="Loading your cart">
      <h1 className="mb-4 text-xl font-bold">{title}</h1>
      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex animate-pulse gap-3 rounded-card border border-border bg-surface p-3">
            <div className="h-20 w-20 shrink-0 rounded-md bg-border" />
            <div className="flex flex-1 flex-col justify-between">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="flex items-center justify-between">
                <div className="h-8 w-24 rounded-full bg-border" />
                <div className="h-4 w-16 rounded bg-border" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-14 animate-pulse rounded-card border border-border bg-surface" />
      <span className="sr-only">Loading your cart…</span>
    </div>
  );
}
