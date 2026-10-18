// Forgiving product search used by the header suggestions and the results page:
// it ignores case and punctuation, copes with small typos ("hemlet", "speker") and knows a few
// everyday synonyms ("trainers" finds sneakers, "fridge" finds refrigerators).

export interface SearchDoc {
  name: string;
  category: string; // slug
  subcategory?: string;
}

const SYNONYMS: Record<string, string[]> = {
  trainers: ["sneakers", "shoes"], sneaker: ["sneakers"], shoe: ["shoes", "sneakers"], kicks: ["sneakers"],
  fridge: ["refrigerator"], freezer: ["refrigerator"], tv: ["television", "bracket", "mount"],
  speaker: ["speakers", "woofer", "soundbar"], woofer: ["speaker", "speakers"], subwoofer: ["woofer", "speaker"],
  helmets: ["helmet"], gloves: ["glove"], glove: ["gloves"], jacket: ["jackets"], raincoat: ["rain", "coat"],
  rider: ["riding", "motorcycle", "helmet", "gloves"], bike: ["motorcycle", "riding"], biker: ["riding", "motorcycle"],
  lock: ["padlock", "locks"], padlock: ["lock", "locks"], gym: ["dumbbell", "barbell", "stepper"],
  mosquito: ["net", "nets"], net: ["mosquito"], bedding: ["duvet", "bedsheet", "bedsheets", "blanket"],
  duvet: ["duvet", "quilt"], curtain: ["curtains"], cooker: ["stove", "cooker", "oven"], stove: ["cooker", "burner"],
  oven: ["microwave"], washer: ["washing"], phone: ["phones"], kids: ["kid", "baby", "toy"], toy: ["toys"],
  flask: ["thermos", "flask"], cookware: ["pot", "pots", "pan", "pans"], blender: ["blender", "mixer"],
  watch: ["watches", "smartwatch"], smartwatch: ["watch"], shaver: ["clipper", "trimmer"], hair: ["dryer", "clipper", "trimmer"],
};

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

// Edit distance where swapping two neighbouring letters counts as one slip ("hemlet" is one
// slip from "helmet"). Gives up early once the distance has to exceed `max`.
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      cur[j] = d;
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return false;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length] <= max;
}

// How well one query word matches the words of a product (0 = not at all).
function wordScore(q: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    if (w === q) return 3;
    if (q.length >= 2 && w.startsWith(q)) best = Math.max(best, 2.5);
    else if (q.length >= 3 && w.includes(q)) best = Math.max(best, 2);
    else if (q.length >= 4 && within(q, w, q.length >= 7 ? 2 : 1)) best = Math.max(best, 1.5);
  }
  return best;
}

export function scoreDoc(query: string, doc: SearchDoc): number {
  const qs = tokens(query);
  if (qs.length === 0) return 1;
  const words = tokens(`${doc.name} ${doc.subcategory ?? ""}`);
  const catWords = tokens(doc.category);
  let total = 0;
  for (const q of qs) {
    let s = wordScore(q, words);
    if (s === 0) for (const alt of SYNONYMS[q] ?? []) s = Math.max(s, wordScore(alt, words) * 0.8);
    if (s === 0) s = wordScore(q, catWords) * 0.7;
    if (s === 0) return 0; // every word has to match something
    total += s;
  }
  // Names that start with the query read as better matches.
  if (normalize(doc.name).startsWith(normalize(query))) total += 1;
  return total;
}

export function searchDocs<T extends SearchDoc>(items: T[], query: string, limit = Infinity): T[] {
  const scored: { item: T; score: number; i: number }[] = [];
  items.forEach((item, i) => {
    const score = scoreDoc(query, item);
    if (score > 0) scored.push({ item, score, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, limit).map((s) => s.item);
}
