// What kind of product something is, and a few facts that are plain in its name. Used only to fill the category
// filters for products whose backend entry has no "Type: ..." / "Brand: ..." lines yet. Edit the lists below freely;
// the first rule that matches a product's name wins. A product with a subcategory set in the admin uses that instead.

const TYPE_RULES: Record<string, [RegExp, string][]> = {
  "motorcycle-gear": [
    [/helmet/i, "Helmets"], [/glove/i, "Gloves"], [/boot/i, "Boots"],
    [/knee|elbow|chest|back protector|guard/i, "Protection"],
    [/rain (coat|suit)/i, "Rain wear"], [/pants|trouser/i, "Riding pants"],
    [/riding set|jacket|vest|armou?r/i, "Jackets & vests"], [/top box|balaclava|mask/i, "Accessories"],
  ],
  "sneakers-shoes": [
    [/boot/i, "Boots"], [/sandal|mule/i, "Sandals & mules"], [/sneaker|runner|trainer/i, "Sneakers"],
    [/shoe|brogue/i, "Casual & official shoes"],
  ],
  "home-appliances": [
    [/microwave/i, "Microwaves"], [/fridge|refrigerator/i, "Fridges"], [/washing machine|washing/i, "Washing machines"],
    [/blender|juicer|mincer|mixer|chopper/i, "Blenders & mixers"], [/air ?fryer|pressure cooker|rice cooker|roti|popcorn|breakfast maker|cake machine|sealer/i, "Cookers & kitchen machines"],
    [/cooker|stove|burner|jiko|hot plate|oven|gas|infrared/i, "Cookers & stoves"], [/heater/i, "Heaters"], [/fan\b/i, "Fans"],
    [/water dispenser|kettle|bucket/i, "Water & kettles"], [/vacuum|steam cleaner/i, "Cleaning"],
  ],
  "audio-speakers": [
    [/soundbar/i, "Soundbars"], [/home theat/i, "Home theatre systems"], [/headphone|mic(rophone)?\b/i, "Headphones & mics"],
    [/bluetooth|portable|party/i, "Bluetooth speakers"], [/speaker|woofer|audio/i, "Multimedia speakers"],
  ],
  electronics: [
    [/tv mount|bracket/i, "TV mounts"], [/\btv\b/i, "TVs"], [/extension/i, "Extension leads"], [/watch/i, "Smart watches"],
    [/router|phone/i, "Networking & phones"], [/calculator/i, "Calculators"], [/tripod|selfie|oraimo|zon/i, "Phone & photo accessories"],
    [/scale|freezer|bank|dispenser/i, "Home gadgets"],
  ],
  "kitchen-dining": [
    [/feeding|infant|toddler|baby/i, "Baby feeding"], [/flask|lunch|tumbler|cup|bottle/i, "Lunch boxes & flasks"], [/cookware|pot\b|cutlery|dish|bowl|bento|plate/i, "Cookware & tableware"],
    [/holder|rack|tray|basket|trolley|organi[sz]er|trash|liner|mat\b/i, "Racks & organisers"],
    [/bag|container|storage|cover|wrap/i, "Food storage"], [/chopper|chipper|poacher|board|straw|apron|glove|coaster|jar/i, "Kitchen tools"],
  ],
  "interior-design": [
    [/duvet|quilt|bedsheet|bedspread|mattress|pillow/i, "Bedding"], [/blanket/i, "Blankets"], [/mosquito|canopy/i, "Mosquito nets"],
    [/curtain/i, "Curtains"], [/towel|bath|toilet|shower/i, "Bathroom"], [/carpet|rug|mat\b/i, "Rugs & mats"],
    [/sofa/i, "Sofa covers"], [/christmas|flower|light/i, "Decor & seasonal"],
  ],
  "toy-shop": [
    [/scooter|skate|slide|vehicle|train|truck|car\b|bus|drone|helicopter|plane|robot|stunt/i, "Ride-ons & vehicles"],
    [/doll|house|kitchen play|tea set|doctor/i, "Role play & dolls"], [/block|tiles|puzzle|cube|maze|bead|learning|montessori|matching|stacking|sorter/i, "Learning & building"],
    [/keyboard|guitar|drum|melodica|microphone|karaoke/i, "Musical toys"], [/art set|activity|book/i, "Art & books"],
    [/game|gun|blaster|target|football|foosball|ring toss|bubble|spinner/i, "Games & outdoor play"],
    [/bottle|lunch|swimming|goggles|play mat/i, "Kids' essentials"], [/birthday|banner|crown|wrapper/i, "Party"],
    [/nail|makeup|safe|cutting|enlighten/i, "Pretend play & puzzles"],
  ],
  "sports-leisure": [
    [/tent/i, "Tents"], [/chair|sleeping bag|umbrella/i, "Camping gear"], [/skat/i, "Skating"], [/dumbbell|kettlebell|stepper|hula/i, "Fitness"],
  ],
  "home-storage": [
    [/shoe/i, "Shoe racks"], [/hanger|clothes|closet|wardrobe/i, "Wardrobe storage"], [/dish|drying/i, "Dish racks"],
    [/organi[sz]er|storage|shelf|rack|basket|trolley|hook|box/i, "Organisers & shelves"], [/broom|planner/i, "Cleaning & home"],
  ],
  "personal-care": [
    [/clipper|trimmer|shaver/i, "Shavers & clippers"], [/hair|straightener|curl|comb/i, "Hair care"], [/gift|perfume|travel bottle/i, "Gifts & travel"], [/massage|sitz|heel/i, "Wellness"],
  ],
  "tools-car-care": [
    [/lock/i, "Locks & padlocks"], [/car|wash/i, "Car care"], [/solar|light/i, "Lighting"], [/drill|tool|ladder|tape|tarpaulin/i, "Tools & hardware"],
  ],
  furniture: [[/guard|lock/i, "Home safety"], [/table/i, "Tables"], [/wardrobe/i, "Wardrobes"], [/seat|chair|airbed/i, "Seating & beds"]],
};

// Brands that open a product name. Kept to brands we are sure of; anything else gets no brand rather than a wrong one.
const BRANDS = [
  "Vitron", "Hisense", "Sokany", "Solarmax", "Tronic", "Alpinestars", "Ailipu", "Ailyons", "Syinix", "Scoyco", "Suomy",
  "Ramtons", "ProBiker", "Pro Biker", "Silver Crest", "Sayona", "Ipcone", "Amtec", "Volsmart", "Luckytex", "Star-X",
  "Dessini", "Powermax", "Globalstar", "Lyschy", "Vemar", "Havit", "Oraimo", "Tenda", "Casio", "Von", "Nunix", "Reki",
  "Sonar", "Royal", "Mindy", "Prestige", "Euroken", "Artel", "Tagwood", "Nobel", "JSB", "York", "Roch", "Wegastar",
];

const BRAND_RE = new RegExp(`^(${BRANDS.map((b) => b.replace(/[-\s]/g, "[-\\s]?")).join("|")})\\b`, "i");

const BRAND_FIX: Record<string, string> = { "pro biker": "ProBiker", probiker: "ProBiker", "silver crest": "Silver Crest" };

export interface Inferred {
  type?: string;
  brand?: string;
  facets: Record<string, string>;
}

export function inferFromName(category: string, name: string): Inferred {
  const type = (TYPE_RULES[category] ?? []).find(([re]) => re.test(name))?.[1];

  const b = BRAND_RE.exec(name.trim());
  const key = b?.[1].toLowerCase().replace(/[-\s]+/g, " ");
  const brand = b ? BRAND_FIX[key!] ?? BRAND_FIX[b[1].toLowerCase()] ?? b[1].replace(/^./, (c) => c.toUpperCase()) : undefined;

  const facets: Record<string, string> = {};
  const litres = /(?<![\w-])(\d+(?:\.\d+)?)\s?-?\s?(?:l|litres?)\b/i.exec(name);
  if (litres) facets.Capacity = `${litres[1]} L`;
  const screen = /\b(\d{2})\s?(?:"|inch)/i.exec(name);
  if (screen && category === "electronics" && /tv/i.test(name) && !/mount|bracket/i.test(name)) facets["Screen size"] = `${screen[1]}"`;
  const channels = /\b([2-5]\.[01])\b/.exec(name);
  if (channels && category === "audio-speakers") facets.Channels = channels[1];
  const bed = /\b(5x6|6x6|6x7|7x8)\b/i.exec(name);
  if (bed && category === "interior-design") facets["Bed size"] = bed[1].toLowerCase().replace("x", " × ");
  const burners = /(\d)\s?-?\s?burner/i.exec(name);
  if (burners) facets.Burners = burners[1];
  if (/bluetooth|\bbt\b/i.test(name) || /\d(?:BT)\b/.test(name)) facets.Connectivity = "Bluetooth";
  return { type, brand, facets };
}
