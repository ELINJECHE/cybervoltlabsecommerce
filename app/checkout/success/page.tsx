import Link from "next/link";
import { buildOrderEnquiryLink } from "@/lib/whatsapp";
import LastOrderReference from "@/components/LastOrderReference";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">✅</span>
      <h1 className="mt-4 text-xl font-bold">Order Received!</h1>
      <p className="mt-2 text-sm text-muted">
        Thanks for your order. Our team will reach out shortly to confirm your M-Pesa payment and
        delivery details.
      </p>
      <LastOrderReference />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="tap-target rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
        <a
          href={buildOrderEnquiryLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
        >
          Message Us on WhatsApp
        </a>
      </div>
    </div>
  );
}
