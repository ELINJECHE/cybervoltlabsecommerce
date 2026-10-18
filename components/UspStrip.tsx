const ITEMS = [
  { icon: "⚡", title: "Dispatched in 2 hours", text: "Same-day in Nairobi" },
  { icon: "🚚", title: "Delivery from KSh 100", text: "Countrywide parcels too" },
  { icon: "📲", title: "Pay with M-Pesa", text: "Secure Till payment" },
  { icon: "↩️", title: "48-hour returns", text: "After delivery" },
];

// Four short promises right under the hero.
export default function UspStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <ul className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
        {ITEMS.map((item) => (
          <li key={item.title} className="flex min-w-[13.5rem] shrink-0 items-center gap-2.5 rounded-card border border-border bg-surface px-3 py-2 sm:min-w-0">
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="block text-xs text-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
