import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { DELIVERY_TERMS } from "@/lib/delivery";

export const metadata: Metadata = pageMetadata({
  title: "Delivery",
  description:
    "Cybervolt Labs delivery: flat Ksh 999 per order anywhere in Kenya via Parcel Grid, 1-2 business days (Monday to Saturday). Pay on delivery.",
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Delivery</h1>
      <ul className="flex flex-col gap-3 text-muted">
        {DELIVERY_TERMS.map((term) => (
          <li key={term}>• {term}</li>
        ))}
      </ul>
      <p className="mt-6 text-muted">
        Changed your mind? See our{" "}
        <Link href="/returns" className="font-medium text-primary hover:underline">Return Policy</Link>.
      </p>
    </div>
  );
}
