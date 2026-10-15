// Delivery fees by area, from "Nairobi Routes Rates.xlsx".
//
// Where the sheet gave a range (e.g. Karen 800-1000) or listed an area several times at different
// prices, it is a ranged area: the customer types their building / estate, the top of the range
// is charged so the rider is always covered, and the shop narrows the exact fee with the
// customer on WhatsApp using that building.
// "Nairobi CBD" is KSh 100 (set by the owner; the sheet's two bare "Nairobi" rows were dropped).
// The sheet shortened some names to their first word; the likely full names are used here.
// To change a fee or split an area, edit this table only; checkout and totals follow.

export interface DeliveryZone {
  slug: string;
  name: string;
  // What is charged now. For a ranged area this is the TOP of the range.
  fee: number;
  // Set only for ranged areas: the bottom of the range.
  minFee?: number;
}

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const zone = (name: string, fee: number): DeliveryZone => ({ slug: slugify(name), name, fee });
const ranged = (name: string, minFee: number, maxFee: number): DeliveryZone => ({
  slug: slugify(name),
  name,
  fee: maxFee,
  minFee,
});

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
  // Building / estate typed by the customer (ranged areas).
  building?: string;
  // Charged now, added to the M-Pesa total.
  fee: number;
  // True when the fee is settled with the courier on delivery instead.
  payOnDelivery: boolean;
  // Ranged area: the customer must type their building / estate.
  needsBuilding: boolean;
  // e.g. "KSh 500–700" for a ranged area; the top of it is what's charged now.
  range?: string;
}

export function feeLabel(z: DeliveryZone): string {
  return z.minFee !== undefined && z.minFee !== z.fee ? `KSh ${z.minFee}–${z.fee}` : `KSh ${z.fee}`;
}

export function isRanged(z: DeliveryZone): boolean {
  return z.minFee !== undefined && z.minFee !== z.fee;
}

export function resolveDelivery(slug: string, building = ""): DeliverySelection | null {
  if (slug === OUTSIDE_NAIROBI_SLUG) {
    return { slug, name: "Outside Nairobi", fee: 0, payOnDelivery: true, needsBuilding: false };
  }
  const found = NAIROBI_ZONES.find((z) => z.slug === slug);
  if (!found) return null;

  const typed = building.trim();
  return {
    slug: found.slug,
    name: found.name,
    building: typed || undefined,
    fee: found.fee,
    payOnDelivery: false,
    needsBuilding: isRanged(found) && !typed,
    ...(isRanged(found) ? { range: feeLabel(found) } : {}),
  };
}

// One line for the order sheet's Notes column and the rider.
export function describeDelivery(sel: DeliverySelection): string {
  return sel.payOnDelivery
    ? "Delivery: outside Nairobi, parcel fee (KSh 300-1000) payable to courier on delivery"
    : sel.range
      ? `Delivery: ${sel.name}, building: ${sel.building ?? "?"}, range ${sel.range}, charged top rate KSh ${sel.fee} - confirm exact fee for the building`
      : `Delivery: ${sel.name}, KSh ${sel.fee}`;
}
