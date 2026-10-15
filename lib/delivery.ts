// Delivery fees by area, from "Nairobi Routes Rates.xlsx".
//
// Where the sheet gave a range (e.g. Karen 800-1000) or listed an area several times at different
// prices, it is a ranged area: the customer then picks a building (see BUILDINGS) to narrow the
// fee, and anyone not listed pays the top of the range so the rider is always covered.
// "Nairobi CBD" is KSh 100 (set by the owner; the sheet's two bare "Nairobi" rows were dropped).
// The sheet shortened some names to their first word; the likely full names are used here.
// To change a fee or split an area, edit this table only; checkout and totals follow.

export interface DeliveryZone {
  slug: string;
  name: string;
  // What is charged. For a ranged area this is the TOP of the range, used until the customer
  // picks a building that narrows it down.
  fee: number;
  // Set only for ranged areas: the bottom of the range.
  minFee?: number;
}

export interface Building {
  name: string;
  fee: number;
}

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const zone = (name: string, fee: number): DeliveryZone => ({ slug: slugify(name), name, fee });
const ranged = (name: string, minFee: number, maxFee: number): DeliveryZone => ({
  slug: slugify(name),
  name,
  fee: maxFee,
  minFee,
});

// Buildings / estates that narrow a ranged area's fee, keyed by zone slug. Customers pick one
// after choosing the area; anyone not listed pays the top of the range. A ranged area with no
// buildings listed here simply charges the top of its range and shows no building list.
//   e.g. kasarani: [{ name: "Mwiki Estate", fee: 600 }, { name: "Kasarani Mall area", fee: 500 }]
export const BUILDINGS: Record<string, Building[]> = {};

export const OTHER_BUILDING = "Other / not listed";

export const NAIROBI_ZONES: DeliveryZone[] = [
  ranged("Buruburu", 400, 500),
  zone("Dandora", 600),
  zone("Donholm", 500),
  zone("Eastleigh", 300),
  zone("Embakasi", 700),
  zone("Garden Estate", 600),
  ranged("Githurai", 600, 800),
  zone("Huruma", 400),
  zone("Hurlingham", 400),
  zone("Imara Daima", 500),
  ranged("Kangemi", 500, 600),
  zone("Kariobangi", 500),
  ranged("Karen", 800, 1000),
  ranged("Kasarani", 500, 700),
  ranged("Kawangware", 500, 700),
  zone("Kayole", 700),
  zone("Kibera", 600),
  zone("Kileleshwa", 400),
  ranged("Kilimani", 400, 500),
  ranged("Komarock", 700, 800),
  zone("Korogocho", 400),
  ranged("Langata", 500, 1000),
  ranged("Lavington", 500, 700),
  zone("Madaraka", 400),
  zone("Mathare", 400),
  zone("Mihango", 700),
  zone("Mlango Kubwa", 300),
  zone("Mwihoko", 1000),
  zone("Mwiki", 700),
  zone("Nairobi CBD", 100),
  ranged("Ngara", 250, 300),
  zone("Njiru", 800),
  ranged("Nyayo Estate", 600, 700),
  zone("Pangani", 300),
  ranged("Parklands", 400, 500),
  zone("Pipeline", 700),
  ranged("Ridgeways", 500, 700),
  ranged("Riverside", 400, 500),
  zone("Roysambu", 500),
  zone("Ruai", 1200),
  zone("Ruaraka", 500),
  ranged("South B / South C", 400, 500),
  zone("Spring Valley", 700),
  zone("Thome", 500),
  ranged("Umoja", 500, 700),
  zone("Upper Hill", 350),
  zone("Utawala", 1000),
  ranged("Westlands", 400, 500),
  zone("Woodley", 500),
  zone("Zimmerman", 600),
];

export const OUTSIDE_NAIROBI_SLUG = "outside-nairobi";

// Parcel couriers charge by weight (about KSh 300-1,000) and are paid by the customer when
// the parcel arrives, so this fee is NOT part of the M-Pesa total.
export const OUTSIDE_NAIROBI_NOTE =
  "Parcel delivery is about KSh 300–1,000 depending on weight, paid to the courier when you receive your order. It isn't included in the M-Pesa amount.";

export interface DeliverySelection {
  slug: string;
  name: string;
  // Building chosen inside a ranged area, if any.
  building?: string;
  // Charged now, added to the M-Pesa total.
  fee: number;
  // True when the fee is settled with the courier on delivery instead.
  payOnDelivery: boolean;
  // The customer still has to pick a building before the fee is final.
  needsBuilding: boolean;
}

export function buildingsFor(zoneSlug: string): Building[] {
  return BUILDINGS[zoneSlug] ?? [];
}

export function feeLabel(z: DeliveryZone): string {
  return z.minFee !== undefined && z.minFee !== z.fee ? `KSh ${z.minFee}–${z.fee}` : `KSh ${z.fee}`;
}

export function resolveDelivery(slug: string, building = ""): DeliverySelection | null {
  if (slug === OUTSIDE_NAIROBI_SLUG) {
    return { slug, name: "Outside Nairobi", fee: 0, payOnDelivery: true, needsBuilding: false };
  }
  const found = NAIROBI_ZONES.find((z) => z.slug === slug);
  if (!found) return null;

  const options = buildingsFor(found.slug);
  const chosen = options.find((b) => b.name === building);
  const hasList = found.minFee !== undefined && options.length > 0;
  return {
    slug: found.slug,
    name: found.name,
    building: chosen?.name ?? (hasList && building === OTHER_BUILDING ? OTHER_BUILDING : undefined),
    fee: chosen ? chosen.fee : found.fee,
    payOnDelivery: false,
    needsBuilding: hasList && !chosen && building !== OTHER_BUILDING,
  };
}

// One line for the order sheet's Notes column and the rider.
export function describeDelivery(sel: DeliverySelection): string {
  return sel.payOnDelivery
    ? "Delivery: outside Nairobi, parcel fee (KSh 300-1000) payable to courier on delivery"
    : `Delivery: ${sel.name}${sel.building ? ` (${sel.building})` : ""}, KSh ${sel.fee}`;
}
