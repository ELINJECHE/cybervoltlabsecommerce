import type { Metadata } from "next";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">Return Policy</h1>
      <ul className="flex flex-col gap-3 text-muted">
        <li>• Returns accepted within 48 hours of delivery for unused items in original packaging.</li>
        <li>• Defective items are replaced free of charge — message us on WhatsApp with a photo/video.</li>
        <li>• Delivery fees are non-refundable unless the item arrived damaged or incorrect.</li>
        <li>• Refunds are processed via M-Pesa within 3-5 business days of an approved return.</li>
      </ul>
    </div>
  );
}
