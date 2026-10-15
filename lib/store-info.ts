// Shop details shown on the manual-payment screens. Set in Netlify (or .env.local);
// anything left blank is simply left out of the page rather than shown as a gap.
const clean = (value: string | undefined) => value?.trim() || null;

export const MPESA_TILL = process.env.NEXT_PUBLIC_MPESA_TILL ?? "000000";

// The business name M-Pesa shows before the customer enters their PIN.
export const TILL_NAME = clean(process.env.NEXT_PUBLIC_TILL_NAME);

// e.g. "24 hours" — how long an unpaid order is held.
export const ORDER_HOLD_TIME = clean(process.env.NEXT_PUBLIC_ORDER_HOLD_TIME);

// e.g. "1–2 days within Nairobi, 2–4 days elsewhere"
export const DELIVERY_ESTIMATE = clean(process.env.NEXT_PUBLIC_DELIVERY_ESTIMATE);

// The headline promise, repeated in the banner, hero, product pages and checkout.
// Scoped to Nairobi on purpose; the rest of the country is 2-4 days.
export const SAME_DAY_HEADLINE = "Same-day delivery in Nairobi";
