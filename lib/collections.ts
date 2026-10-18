import type { Product } from "@/lib/types";

// "Shop by need" collections: hand-picked groupings by category and keyword, with no discount claims.
export interface Collection {
  slug: string;
  title: string;
  icon: string;
  blurb: string;
  description: string;
  match: (p: Product) => boolean;
}

const price = (p: Product) => p.discountPrice ?? p.price;

export const COLLECTIONS: Collection[] = [
  {
    slug: "rider-kit",
    title: "Rider kit",
    icon: "🏍️",
    blurb: "Helmets, gloves, jackets, boots and guards",
    description: "Everything for the road in one place: helmets, riding gloves, jackets, rain gear, boots and knee and elbow guards.",
    match: (p) => p.category === "motorcycle-gear",
  },
  {
    slug: "home-starter",
    title: "New home starter",
    icon: "🏠",
    blurb: "Cookware, small appliances, bedding and storage",
    description: "Setting up a new place? Cookware, small appliances, bedding, curtains and storage to get you started.",
    match: (p) =>
      ["kitchen-dining", "home-storage", "interior-design"].includes(p.category) ||
      (p.category === "home-appliances" && price(p) <= 8000),
  },
  {
    slug: "gifts",
    title: "Gifts under KSh 3,000",
    icon: "🎁",
    blurb: "Toys, grooming sets and thoughtful extras",
    description: "Easy gift ideas under KSh 3,000: toys, grooming gift sets, candles and small home treats.",
    match: (p) => ["toy-shop", "personal-care", "interior-design", "kitchen-dining"].includes(p.category) && price(p) <= 3000,
  },
  {
    slug: "fitness-outdoors",
    title: "Fitness & outdoors",
    icon: "💪",
    blurb: "Dumbbells, steppers, camping and sleeping gear",
    description: "Home gym gear and the outdoors: dumbbells and barbells, steppers, camping chairs, tents and sleeping bags.",
    match: (p) => p.category === "sports-leisure" || /camp|tent|sleeping bag|stepper|dumbbell|barbell|skate/i.test(p.name),
  },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}
