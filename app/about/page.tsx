import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our Story",
  description:
    "Kenyan online shop in Ongata Rongai selling phones, fashion, furniture and motorcycle gear. Pay with M-Pesa; delivery across Kenya.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Our Story</h1>
      <p className="mb-4 text-muted">
        Cybervolt Labs began as a small electronics stall reaching customers through Jumia, Jiji,
        TikTok, Instagram and WhatsApp. As demand grew, so did our catalog — earbuds, power banks,
        smart watches, phone accessories and home lighting, all sourced for reliability rather than
        chasing the lowest possible price.
      </p>
      <p className="text-muted">
        Today this storefront brings everything under one roof, with the same fast Nairobi delivery,
        M-Pesa payment, and WhatsApp support our customers already know us for.
      </p>
    </div>
  );
}
