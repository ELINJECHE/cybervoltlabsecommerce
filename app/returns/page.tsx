import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { RETURN_TERMS } from "@/lib/delivery";

export const metadata: Metadata = pageMetadata({
  title: "Return Policy",
  description:
    "Cybervolt Labs return policy: returns within 48 hours (2 days) of delivery for new, unused items in original packaging. Exchanges accepted, no restocking fee, refunds via M-Pesa.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Return Policy</h1>
      <ul className="flex flex-col gap-3 text-muted">
        {RETURN_TERMS.map((term) => (
          <li key={term}>• {term}</li>
        ))}
      </ul>
      <p className="mt-6 text-muted">
        Delivery fee, times and payment:{" "}
        <Link href="/shipping" className="font-medium text-primary hover:underline">Delivery</Link>.
      </p>
    </div>
  );
}
