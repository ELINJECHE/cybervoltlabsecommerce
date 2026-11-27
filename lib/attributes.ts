import type { Product, ProductSpec } from "@/lib/types";

// Product facts, kept in the one place the backend already has: the `features` list.
//
// A line written as  "Label: value"  is a fact, not a bullet point:
//   Brand: Hisense          Model: H20MOWS11        GTIN: 6001234567890
//   Condition: new          Sizes: 40, 41, 42, 43   Material: Stainless steel
//   Capacity: 20 L          Colours: black, white   (any other label becomes a row in the spec table)
// Lines without a colon stay ordinary bullet points. Uploading products to the backend with such lines is all
// that is needed: they feed the spec table, Google's product data and the category filters.

type Reserved = "brand" | "mpn" | "gtin" | "condition" | "sizes";

const RESERVED_LABELS: Record<string, Reserved> = {
  brand: "brand",
  make: "brand",
  model: "mpn",
  "model number": "mpn",
  mpn: "mpn",
  gtin: "gtin",
  barcode: "gtin",
  ean: "gtin",
  upc: "gtin",
  condition: "condition",
  sizes: "sizes",
  "shoe sizes": "sizes",
};

// "Colour", "Colours", "Color" and "Colors" are the same fact.
const LABEL_ALIASES: Record<string, string> = { colours: "Colour", colour: "Colour", colors: "Colour", color: "Colour" };

const SPEC_LINE = /^([A-Za-z][A-Za-z0-9 /&().'-]{0,27}?)\s*:\s*(\S.*)$/;

export function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cleanLabel(raw: string): string {
  const label = raw.trim().replace(/\s+/g, " ");
  return LABEL_ALIASES[label.toLowerCase()] ?? titleCase(label);
}

// A barcode is only accepted when its check digit is right, so a typo can't get a listing rejected by Google.
export function validGtin(raw: string | undefined): string | undefined {
  const digits = (raw ?? "").replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits) || ![8, 12, 13, 14].includes(digits.length)) return undefined;
  const body = digits.slice(0, -1).split("").reverse();
  const sum = body.reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.slice(-1)) ? digits : undefined;
}

export interface ParsedFeatures {
  bullets: string[];
  reserved: Partial<Record<Reserved, string>>;
  specs: ProductSpec[];
}

export function splitFeatureLines(lines: string[]): ParsedFeatures {
  const out: ParsedFeatures = { bullets: [], reserved: {}, specs: [] };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = SPEC_LINE.exec(line);
    if (!m) {
      out.bullets.push(line);
      continue;
    }
    const key = RESERVED_LABELS[m[1].trim().toLowerCase()];
    if (key) out.reserved[key] = m[2].trim();
    else out.specs.push({ label: cleanLabel(m[1]), value: m[2].trim() });
  }
  return out;
}

// The reverse, used by the admin form: fixed fields and the spec list go back into `features` as "Label: value" lines.
export function joinFeatureLines(parts: {
  brand?: string;
  mpn?: string;
  gtin?: string;
  condition?: string;
  sizes?: string;
  specsText?: string;
  bulletsText?: string;
}): string[] {
  const lines: string[] = [];
  const add = (label: string, value?: string) => {
    if (value && value.trim()) lines.push(`${label}: ${value.trim()}`);
  };
  add("Brand", parts.brand);
  add("Model", parts.mpn);
  add("GTIN", parts.gtin);
  add("Condition", parts.condition && parts.condition !== "new" ? parts.condition : undefined);
  add("Sizes", parts.sizes);
  for (const l of (parts.specsText ?? "").split("\n")) if (l.trim()) lines.push(l.trim());
  for (const l of (parts.bulletsText ?? "").split("\n")) if (l.trim()) lines.push(l.trim());
  return lines;
}

function splitValues(label: string, value: string): string[] {
  const parts = label === "Colour" ? value.split(/,|\/|&|\band\b/i) : value.split(",");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const v = titleCase(p.trim());
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}

const CONDITIONS = ["new", "used", "refurbished"] as const;

// Reads the fact lines out of `features` and fills in the Product fields and the facets used by the filters.
// `inferred` are guesses made from the product's name (lib/product-types.ts); they only fill gaps and only ever
// reach the filters, never Google.
export function enrichProduct(
  product: Product,
  inferred: { type?: string; brand?: string; facets: Record<string, string> }
): Product {
  const { bullets, reserved, specs } = splitFeatureLines(product.features ?? []);

  const brand = reserved.brand ?? product.brand;
  const mpn = reserved.mpn ?? product.mpn;
  const gtin = validGtin(reserved.gtin) ?? product.gtin;
  const condition = CONDITIONS.find((c) => c === reserved.condition?.toLowerCase()) ?? product.condition;
  const sizes = reserved.sizes ? splitValues("Sizes", reserved.sizes) : product.sizes;

  const facets: Record<string, string[]> = {};
  const type = product.subcategory ? titleCase(product.subcategory.replace(/-/g, " ")) : inferred.type;
  if (type) facets.Type = [type];
  const shownBrand = brand ?? inferred.brand;
  if (shownBrand) facets.Brand = [shownBrand];
  if (condition) facets.Condition = [titleCase(condition)];
  const swatches = (product.colors ?? []).map((c) => titleCase(c.name));
  for (const s of specs) {
    const values = splitValues(s.label, s.value);
    if (values.length > 0) facets[s.label] = [...(facets[s.label] ?? []), ...values];
  }
  if (swatches.length > 0) facets.Colour = Array.from(new Set([...(facets.Colour ?? []), ...swatches]));
  for (const [label, value] of Object.entries(inferred.facets)) if (!facets[label]) facets[label] = [value];

  return {
    ...product,
    features: bullets,
    ...(brand ? { brand } : {}),
    ...(mpn ? { mpn } : {}),
    ...(gtin ? { gtin } : {}),
    ...(condition ? { condition } : {}),
    ...(sizes && sizes.length > 0 ? { sizes } : {}),
    ...(specs.length > 0 ? { specs } : {}),
    ...(type ? { type } : {}),
    facets,
  };
}
