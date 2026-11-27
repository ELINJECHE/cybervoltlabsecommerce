// Delivery and returns terms, in one place. These must match Google Merchant Center word for word
// and number for number (shipping and return settings there), or Google flags the products.
// Change a term here and in Merchant Center together; the pages, checkout and product data follow.

export const COURIER = "Parcel Grid";

// Flat fee per order, anywhere in Kenya. Added to the order total and paid on delivery.
export const DELIVERY_FEE = 999;

export const SHOP_ADDRESS = "Brisma Tower, Ground Floor, Ongata Rongai";

// Orders placed before this hour (East Africa Time) are dispatched the same day.
export const DISPATCH_CUTOFF_HOUR = 14;

// Free collection at the shop (chosen at checkout; saved on the order as the method "pickup").
export const PICKUP_AREA = "Shop pickup";
export const PICKUP_LINE = `Or collect free at our shop: ${SHOP_ADDRESS}.`;

// Shown on every product page next to the price.
export const PRODUCT_DELIVERY_LINE = "Delivery Ksh 999 via Parcel Grid, 1-2 days, pay on delivery.";

// Short version for banners and page descriptions.
export const DELIVERY_SUMMARY = "Delivery Ksh 999 anywhere in Kenya, 1-2 business days. Pay on delivery.";

// The delivery page, as bullet points (also the source for the order-confirmation steps).
export const DELIVERY_TERMS = [
  "Orders are delivered via Parcel Grid.",
  "Delivery fee: flat Ksh 999 per order, anywhere in Kenya.",
  "Delivery time: 1-2 business days (Monday to Saturday).",
  "Orders placed before 2:00 PM East Africa Time are dispatched the same day. Orders after 2:00 PM go out the next business day.",
  "Payment: pay on delivery. Customers pay when they collect or receive their parcel.",
  `Customers can also view and collect items at our shop: ${SHOP_ADDRESS}.`,
];

export const RETURN_DAYS = 2;

export const RETURN_TERMS = [
  "Returns accepted within 48 hours (2 days) of delivery for new, unused items in original packaging.",
  "Exchanges are accepted.",
  "Defective items are replaced free of charge. Message us on WhatsApp with a photo or video.",
  `Returns can be made in store (${SHOP_ADDRESS}) or at a Parcel Grid drop-off point.`,
  "No restocking fee.",
  "The Ksh 999 delivery fee is non-refundable unless the item arrived damaged or incorrect.",
  "Refunds are sent via M-Pesa within 5 business days of an approved return.",
];

// One line for the order sheet's Notes column.
export function describeDelivery(fee: number): string {
  return `Delivery: ${COURIER}, KSh ${fee}, pay on delivery`;
}

export function describePickup(): string {
  return `PICKUP: customer collects at our shop (${SHOP_ADDRESS}), no delivery fee, pay on collection`;
}
