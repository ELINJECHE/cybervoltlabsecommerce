// "Order in the next 3h 10m for same-day dispatch" — and what to say after 2:00 PM, on Sundays
// and on public holidays. Everything is worked out in Nairobi time (UTC+3, no daylight saving),
// never the visitor's device clock.

import { DISPATCH_CUTOFF_HOUR } from "@/lib/delivery";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Fixed-date public holidays (month-day). A fixed holiday that falls on a Sunday moves to the Monday.
const FIXED_HOLIDAYS = ["01-01", "05-01", "06-01", "10-10", "10-20", "12-12", "12-25", "12-26"];

// Movable holidays the government declares each year (Eid days and any special days): add them
// here as "YYYY-MM-DD" so the page stops promising same-day dispatch on them.
export const EXTRA_HOLIDAYS: string[] = [];

// "Nairobi wall clock" as a Date whose UTC fields read as Nairobi time.
function nairobi(d: Date): Date {
  return new Date(d.getTime() + EAT_OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (n: Date) => `${n.getUTCFullYear()}-${pad(n.getUTCMonth() + 1)}-${pad(n.getUTCDate())}`;

// Western Easter (Good Friday and Easter Monday are public holidays).
function easter(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function holidaysFor(year: number): Set<string> {
  const set = new Set<string>(EXTRA_HOLIDAYS);
  for (const md of FIXED_HOLIDAYS) {
    const d = new Date(`${year}-${md}T00:00:00Z`);
    set.add(ymd(d));
    if (d.getUTCDay() === 0) set.add(ymd(new Date(d.getTime() + DAY_MS)));
  }
  const e = easter(year);
  set.add(ymd(new Date(e.getTime() - 2 * DAY_MS)));
  set.add(ymd(new Date(e.getTime() + DAY_MS)));
  return set;
}

export function isDeliveryDay(n: Date): boolean {
  if (n.getUTCDay() === 0) return false; // Sunday
  return !holidaysFor(n.getUTCFullYear()).has(ymd(n));
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type DeliveryStatus =
  | { kind: "same-day"; msLeft: number }
  | { kind: "next"; when: string; reason: "after-hours" | "no-delivery-day" };

export function deliveryStatus(now: Date = new Date()): DeliveryStatus {
  const n = nairobi(now);
  const msIntoDay = n.getUTCHours() * 3_600_000 + n.getUTCMinutes() * 60_000 + n.getUTCSeconds() * 1000;
  const cutoff = DISPATCH_CUTOFF_HOUR * 3_600_000;
  if (isDeliveryDay(n) && msIntoDay < cutoff) return { kind: "same-day", msLeft: cutoff - msIntoDay };

  // Next day we dispatch on.
  let next = new Date(n.getTime() + DAY_MS);
  for (let i = 0; i < 10 && !isDeliveryDay(next); i++) next = new Date(next.getTime() + DAY_MS);
  const tomorrow = new Date(n.getTime() + DAY_MS);
  const when = ymd(next) === ymd(tomorrow) ? "tomorrow" : WEEKDAYS[next.getUTCDay()];
  return { kind: "next", when, reason: isDeliveryDay(n) ? "after-hours" : "no-delivery-day" };
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
}

// One line for the banner and the product page.
export function deliveryHeadline(s: DeliveryStatus): string {
  if (s.kind === "same-day") return `Order in the next ${formatCountdown(s.msLeft)} for same-day dispatch`;
  return s.reason === "after-hours"
    ? `Orders after 2:00 PM go out the next business day (${s.when})`
    : `We dispatch Monday to Saturday. Order now, dispatched ${s.when}`;
}

// "YYYY-MM-DD" by which an order placed now should have arrived: dispatched today if it is a business day before the
// 2:00 PM cutoff (otherwise the next one), plus up to 2 business days with the courier (Parcel Grid's "1-2 days").
// Used for the Google Customer Reviews opt-in, which asks for the latest expected date.
export function estimatedDeliveryDate(now: Date = new Date()): string {
  let d = nairobi(now);
  const msIntoDay = d.getUTCHours() * 3_600_000 + d.getUTCMinutes() * 60_000 + d.getUTCSeconds() * 1000;
  if (!isDeliveryDay(d) || msIntoDay >= DISPATCH_CUTOFF_HOUR * 3_600_000) {
    do d = new Date(d.getTime() + DAY_MS); while (!isDeliveryDay(d));
  }
  for (let left = 2; left > 0; ) {
    d = new Date(d.getTime() + DAY_MS);
    if (isDeliveryDay(d)) left--;
  }
  return ymd(d);
}
