import type { Metadata } from "next";
import { buildOrderEnquiryLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Contact Us</h1>
      <p className="mb-4 text-muted">
        The fastest way to reach us is WhatsApp — we typically reply the same day.
      </p>
      <a
        href={buildOrderEnquiryLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
      >
        💬 Chat on WhatsApp
      </a>
      <div className="mt-6 flex flex-col gap-1 text-muted">
        <p>Email: hello@cybervoltlabs.co.ke</p>
        <p>Instagram: @cybervolt_labs_ &middot; TikTok: @cybervolt_labs</p>
        <p>Facebook &amp; LinkedIn: Cybervolt Labs Kenya</p>
        <p>Based in Nairobi, Kenya — delivering countrywide.</p>
      </div>
    </div>
  );
}
