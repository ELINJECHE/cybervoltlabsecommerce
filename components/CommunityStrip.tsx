import { EXCLUSIVE_GROUP_URL } from "@/lib/community";

// Invites visitors into the free WhatsApp group (new drops first). The MVP group is offered only
// after a purchase, on the order-success page.
export default function CommunityStrip({ className = "" }: { className?: string }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-3 ${className}`}>
      <div className="flex flex-col items-start justify-between gap-3 rounded-card bg-whatsapp/10 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-base font-bold">💬 Be first to see new drops</p>
          <p className="text-sm text-muted">Join our free WhatsApp group: fresh arrivals and offers, straight to your phone.</p>
        </div>
        <a
          href={EXCLUSIVE_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target shrink-0 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95"
        >
          Join the free group
        </a>
      </div>
    </section>
  );
}
