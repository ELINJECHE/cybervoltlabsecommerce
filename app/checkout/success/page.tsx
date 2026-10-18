import Link from "next/link";
import { buildOrderEnquiryLink } from "@/lib/whatsapp";
import LastOrderDetails from "@/components/LastOrderDetails";
import WhatsAppChatLink from "@/components/WhatsAppChatLink";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">✅</span>
      <h1 className="mt-4 text-xl font-bold">Order Received!</h1>
      <p className="mt-2 text-sm text-muted">Thank you — we&rsquo;ve received your order.</p>
      <LastOrderDetails />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="tap-target rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
        <WhatsAppChatLink
          href={buildOrderEnquiryLink()}
          button="chat_nasi"
          placement="order_success"
          className="tap-target rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
        >
          💬 Chat Nasi
        </WhatsAppChatLink>
      </div>
    </div>
  );
}
