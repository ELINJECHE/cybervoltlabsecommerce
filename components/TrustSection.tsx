const TRUST_ITEMS = [
  { icon: "🚚", title: "Delivery Anywhere in Kenya", description: "Ksh 999 via Parcel Grid, 1-2 business days. Orders before 2:00 PM are dispatched the same day." },
  { icon: "🏷️", title: "Clear Prices", description: "Every price is shown in Kenya shillings." },
  { icon: "🤝", title: "Pay on Delivery", description: "Pay when your order arrives, not before." },
  { icon: "🛡️", title: "Buyer Protection", description: "Returns accepted within 48 hours of delivery." },
  { icon: "💬", title: "WhatsApp Support", description: "Real humans, real answers, same day." },
  { icon: "📍", title: "Track Your Order", description: "Message us your order number on WhatsApp and we'll tell you where it is." },
];

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-4 text-lg font-bold">Why Shop With Us</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center"
          >
            <span className="text-2xl" aria-hidden="true">{item.icon}</span>
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <p className="text-xs text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
