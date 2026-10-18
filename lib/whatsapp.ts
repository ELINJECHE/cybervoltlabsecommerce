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

// Supplier numbers are typed by staff in any common form (0712 345 678,
// +254 712 345 678, 712345678); wa.me needs 2547XXXXXXXX / 2541XXXXXXXX.
// Returns null when the number isn't a Kenyan mobile.
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.replace(/^(254|0)/, "");
  return /^[17]\d{8}$/.test(local) ? `254${local}` : null;
}

export function buildPhoneChatLink(phone: string): string {
  return `https://wa.me/${phone}`;
}
