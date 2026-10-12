const STEPS = ["Your details", "Pay with M-Pesa", "Confirm payment"];

// current is 1-based: steps before it show a tick, the current one is highlighted.
export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs sm:text-sm" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex flex-1 items-center gap-2"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-success text-white"
                  : active
                    ? "bg-primary text-white"
                    : "border border-border text-muted"
              }`}
            >
              {done ? "✓" : step}
            </span>
            <span className={active ? "font-semibold" : "text-muted"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
