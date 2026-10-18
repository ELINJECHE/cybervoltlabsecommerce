import type { Product } from "@/lib/types";

// "Complete your set": a few items that go with the one being viewed. Rule-based, with no claims
// about what other customers bought and no invented bundle discount.

const MOTO: { key: string; rx: RegExp }[] = [
  { key: "helmet", rx: /helmet/i },
  { key: "gloves", rx: /glove/i },
  { key: "jacket", rx: /jacket|vest|rain ?coat|rain suit/i },
  { key: "pants", rx: /pants|trouser/i },
  { key: "boots", rx: /boot/i },
  { key: "guards", rx: /guard|knee|elbow/i },
];
const MOTO_PAIRS: Record<string, string[]> = {
  helmet: ["gloves", "jacket", "guards"],
  gloves: ["helmet", "jacket", "boots"],
  jacket: ["pants", "gloves", "helmet"],
  pants: ["jacket", "boots", "guards"],
  boots: ["pants", "gloves", "helmet"],
  guards: ["jacket", "gloves", "helmet"],
};
const CATEGORY_PAIRS: Record<string, string[]> = {
  "home-appliances": ["kitchen-dining", "home-storage"],
  "kitchen-dining": ["home-appliances", "home-storage"],
  "interior-design": ["home-storage", "interior-design"],
  "audio-speakers": ["electronics"],
  electronics: ["audio-speakers"],
  "toy-shop": ["toy-shop"],
  "personal-care": ["personal-care"],
  "sports-leisure": ["sports-leisure"],
  furniture: ["interior-design"],
};

// Items that need a size or colour can't be added blindly from a bundle.
export function needsChoice(p: Product): boolean {
  return (p.colors?.length ?? 0) > 0 || p.category === "sneakers-shoes";
}

const best = (a: Product, b: Product) => b.images.length - a.images.length || (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);

export function completeTheSet(product: Product, all: Product[], limit = 3): Product[] {
  const others = all.filter((p) => p.id !== product.id && !needsChoice(p));
  const picks: Product[] = [];
  const take = (list: Product[]) => {
    const found = list.sort(best).find((p) => !picks.includes(p));
    if (found) picks.push(found);
  };

  if (product.category === "motorcycle-gear") {
    const mine = MOTO.find((g) => g.rx.test(product.name))?.key;
    for (const target of MOTO_PAIRS[mine ?? "helmet"] ?? []) {
      const rx = MOTO.find((g) => g.key === target)!.rx;
      take(others.filter((p) => p.category === "motorcycle-gear" && rx.test(p.name) && p.name !== product.name));
    }
  } else {
    for (const cat of CATEGORY_PAIRS[product.category] ?? []) {
      take(others.filter((p) => p.category === cat));
    }
  }
  return picks.slice(0, limit);
}
