type UspIcon = "dispatch" | "delivery" | "mpesa" | "returns";

const ITEMS: { icon: UspIcon; title: string; text: string }[] = [
  { icon: "dispatch", title: "Dispatched in 2 hours", text: "Same-day in Nairobi" },
  { icon: "delivery", title: "Free delivery over KSh 5,000", text: "In Nairobi. From KSh 100 otherwise" },
  { icon: "mpesa", title: "Pay with M-Pesa", text: "Secure Till payment" },
  { icon: "returns", title: "48-hour returns", text: "After delivery" },
];

// Tile gradients (brand indigo / mint / magenta) behind a white line glyph.
const TILE: Record<UspIcon, string> = {
  dispatch: "linear-gradient(135deg,#4D66B0 0%,#7B5CC4 100%)",
  delivery: "linear-gradient(135deg,#1FA971 0%,#3DD598 100%)",
  mpesa: "linear-gradient(135deg,#16A05A 0%,#4CC36F 100%)",
  returns: "linear-gradient(135deg,#C94DE0 0%,#E174F8 100%)",
};

function Glyph({ name }: { name: UspIcon }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (name) {
    case "dispatch": // stopwatch with a bolt
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...p}>
          <path d="M10 2.5h4M12 5V2.5" />
          <circle cx="12" cy="13.5" r="8" />
          <path d="M12.8 9.6 10.3 13.9h3.4l-2.5 4.1" />
          <path d="m19 6 1.4-1.4" />
        </svg>
      );
    case "delivery": // truck
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...p}>
          <path d="M2 6.5h11.5v10H2z" />
          <path d="M13.5 9.5H18l3.5 3.5v3.5h-8" />
          <circle cx="7" cy="18" r="2" fill="#fff" />
          <circle cx="17" cy="18" r="2" fill="#fff" />
          <path d="M5 10h5" />
        </svg>
      );
    case "mpesa": // phone with a tick
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...p}>
          <rect x="6.5" y="2" width="11" height="20" rx="2.6" />
          <path d="M10.2 18.6h3.6" />
          <path d="m9.4 10.8 2.1 2.1 3.6-3.9" />
        </svg>
      );
    case "returns": // circular return arrow
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...p}>
          <path d="M4 12a8 8 0 1 0 2.5-5.8" />
          <path d="M4 4.2v4.6h4.6" />
          <path d="M12 8.2v4l2.6 1.6" />
        </svg>
      );
  }
}

// Four short promises right under the hero.
export default function UspStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <ul className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
        {ITEMS.map((item) => (
          <li key={item.title} className="flex min-w-[14.5rem] shrink-0 items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 sm:min-w-0">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/5"
              style={{ background: TILE[item.icon] }}
              aria-hidden="true"
            >
              <Glyph name={item.icon} />
            </span>
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
