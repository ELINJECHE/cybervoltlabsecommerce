// Set NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local — international format, no
// "+" or leading zeros, e.g. 2547XXXXXXXX.
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254700000000";

export function buildWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildProductEnquiryLink(productName: string, url?: string): string {
  const message = `Hi Cybervolt Labs, I'd like to order: ${productName}${
    url ? `\n${url}` : ""
  }`;
  return buildWhatsAppLink(message);
}

export function buildOrderEnquiryLink(): string {
  return buildWhatsAppLink("Hi Cybervolt Labs, I have a question about an order.");
}

export function buildTrackOrderLink(): string {
  return buildWhatsAppLink("Hi Cybervolt Labs, I'd like to track my order. My order/phone number is: ");
}

// Falls back to a Jumia search for the product name when a specific
// `jumiaUrl` isn't set on the product — add one per product once your Jumia
// listings are live for a direct link instead.
export function buildJumiaLink(productName: string, jumiaUrl?: string): string {
  if (jumiaUrl) return jumiaUrl;
  return `https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(productName)}`;
}
