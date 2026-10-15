// Delivery fees by area, from "Nairobi Routes Rates.xlsx".
//
// Where the sheet gave a range (e.g. Kasarani 500-1000) or listed the same area more than
// once at different prices, the HIGHEST figure is charged so the rider is always covered.
// The sheet shortened some names to their first word; the likely full names are used here.
// To change a fee or split an area, edit this table only; checkout and totals follow.

export interface DeliveryZone {
  slug: string;
  name: string;
  fee: number;
}

const zone = (name: string, fee: number): DeliveryZone => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  fee,
});

export const NAIROBI_ZONES: DeliveryZone[] = [
  zone("Buruburu", 500),
  zone("Dandora", 600),
  zone("Donholm", 500),
  zone("Eastleigh", 300),
  zone("Embakasi", 700),
  zone("Garden Estate", 600),
  zone("Githurai", 800),
  zone("Huruma", 400),
  zone("Hurlingham", 400),
  zone("Imara Daima", 500),
  zone("Kangemi", 600),
  zone("Kariobangi", 500),
  zone("Karen", 1000),
  zone("Kasarani", 700),
  zone("Kawangware", 700),
  zone("Kayole", 700),
  zone("Kibera", 600),
  zone("Kileleshwa", 400),
  zone("Kilimani", 500),
  zone("Komarock", 800),
  zone("Korogocho", 400),
  zone("Langata", 1000),
  zone("Lavington", 700),
  zone("Madaraka", 400),
  zone("Mathare", 400),
  zone("Mihango", 700),
  zone("Mlango Kubwa", 300),
  zone("Mwihoko", 1000),
  zone("Mwiki", 700),
  zone("Nairobi", 700),
  zone("Ngara", 300),
  zone("Njiru", 800),
  zone("Nyayo Estate", 700),
  zone("Pangani", 300),
  zone("Parklands", 500),
  zone("Pipeline", 700),
  zone("Ridgeways", 700),
  zone("Riverside", 500),
  zone("Roysambu", 500),
  zone("Ruai", 1200),
  zone("Ruaraka", 500),
  zone("South B / South C", 500),
  zone("Spring Valley", 700),
  zone("Thome", 500),
  zone("Umoja", 700),
  zone("Upper Hill", 350),
  zone("Utawala", 1000),
  zone("Westlands", 500),
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
  // Charged now, added to the M-Pesa total.
  fee: number;
  // True when the fee is settled with the courier on delivery instead.
  payOnDelivery: boolean;
}

export function resolveDelivery(slug: string): DeliverySelection | null {
  if (slug === OUTSIDE_NAIROBI_SLUG) {
    return { slug, name: "Outside Nairobi", fee: 0, payOnDelivery: true };
  }
  const found = NAIROBI_ZONES.find((z) => z.slug === slug);
  return found ? { slug: found.slug, name: found.name, fee: found.fee, payOnDelivery: false } : null;
}

// One line for the order sheet's Notes column and the rider.
export function describeDelivery(sel: DeliverySelection): string {
  return sel.payOnDelivery
    ? "Delivery: outside Nairobi, parcel fee (KSh 300-1000) payable to courier on delivery"
    : `Delivery: ${sel.name}, KSh ${sel.fee}`;
}
