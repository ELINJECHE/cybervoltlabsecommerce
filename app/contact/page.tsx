import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { buildOrderEnquiryLink } from "@/lib/whatsapp";
import WhatsAppChatLink from "@/components/WhatsAppChatLink";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Contact Cybervolt Labs on WhatsApp for orders, delivery and support. Based in Ongata Rongai, Kenya, delivering countrywide.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Contact Us</h1>
      <p className="mb-4 text-muted">
        The fastest way to reach us is WhatsApp — we typically reply the same day.
      </p>
      <WhatsAppChatLink
        href={buildOrderEnquiryLink()}
        button="chat_nasi"
        placement="contact_page"
        className="tap-target inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
      >
        💬 Chat Nasi
      </WhatsAppChatLink>
      <div className="mt-6 flex flex-col gap-1 text-muted">
        <p>Email: hello@cybervoltlabs.co.ke</p>
        <p>Instagram: @cybervolt_labs_ &middot; TikTok: @cybervolt_labs</p>
        <p>Facebook &amp; LinkedIn: Cybervolt Labs Kenya</p>
        <p>Based in Nairobi, Kenya — same-day delivery in Nairobi, countrywide in 2-4 days.</p>
      </div>
    </div>
  );
}
