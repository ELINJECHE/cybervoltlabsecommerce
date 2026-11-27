// Forgiving product search used by the header suggestions and the results page:
// it ignores case and punctuation, copes with small typos ("hemlet", "speker") and knows a few
// everyday synonyms ("trainers" finds sneakers, "kneepads" finds knee guards). The synonym list
// lives in lib/search-synonyms.ts.

import { PHRASES, WORDS } from "@/lib/search-synonyms";

export interface SearchDoc {
  name: string;
  category: string; // slug
  subcategory?: string;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Singular and plural count as the same word: pad/pads, glove/gloves, helmet/helmets.
function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && /(ses|xes|ches|shes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean).map(stem);
}

// The synonym file, prepared once. Phrases are keyed with their spaces removed, so "knee pads",
// "kneepads" and "knee pad" all find the same entry.
const PHRASE_BY_COMPACT = new Map<string, string[][]>(
  Object.entries(PHRASES).map(([k, v]) => [tokens(k).join(""), v.map(tokens)] as const),
);
const WORD_ALTS = new Map<string, string[][]>(
  Object.entries(WORDS).map(([k, v]) => [stem(k), v.map((a) => tokens(a))] as const),
);

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

interface Unit { orig: string[]; alts: string[][]; always?: boolean }

// Looks a span up in the phrase list, forgiving a one-letter typo ("kneepds", "knee padz").
function findPhrase(compact: string): string[][] | undefined {
  const exact = PHRASE_BY_COMPACT.get(compact);
  if (exact || compact.length < 6) return exact;
  for (const [key, alts] of Array.from(PHRASE_BY_COMPACT.entries())) if (key.length >= 6 && within(compact, key, 1)) return alts;
  return undefined;
}

// Splits the query into things to find: a known phrase ("knee pads") is one unit with its
// alternatives; any other word is a unit of its own.
function toUnits(qt: string[]): Unit[] {
  const units: Unit[] = [];
  for (let i = 0; i < qt.length; ) {
    let hit: Unit | null = null;
    let len = Math.min(3, qt.length - i);
    for (; len >= 1; len--) {
      const alts = findPhrase(qt.slice(i, i + len).join(""));
      if (alts) { hit = { orig: qt.slice(i, i + len), alts, always: true }; break; }
    }
    if (hit) { units.push(hit); i += len; }
    else { units.push({ orig: [qt[i]], alts: WORD_ALTS.get(qt[i]) ?? [] }); i += 1; }
  }
  return units;
}

// Every word of a phrase has to match; returns the summed score, or 0.
function phraseScore(phrase: string[], words: string[]): number {
  let sum = 0;
  for (const w of phrase) {
    const s = wordScore(w, words);
    if (s === 0) return 0;
    sum += s;
  }
  return sum;
}

function scoreTokens(qt: string[], words: string[], catWords: string[]): number {
  let total = 0;
  for (const unit of toUnits(qt)) {
    let s = phraseScore(unit.orig, words);
    // A phrase from the synonym list always counts its alternatives; a lone word only falls back to them.
    if (s === 0 || unit.always) for (const alt of unit.alts) s = Math.max(s, phraseScore(alt, words) * 0.8);
    if (s === 0 && unit.orig.length === 1) s = wordScore(unit.orig[0], catWords) * 0.7;
    if (s === 0) return 0; // every word has to match something
    total += s;
  }
  return total;
}

export function scoreDoc(query: string, doc: SearchDoc): number {
  const qs = tokens(query);
  if (qs.length === 0) return 1;
  const base = tokens(`${doc.name} ${doc.subcategory ?? ""}`);
  // Joined and split words are the same: "rain coat" is also "raincoat", "kneepads" is also "knee pads".
  const words = [...base, ...base.slice(0, -1).map((w, i) => w + base[i + 1])];
  const catWords = tokens(doc.category);

  let total = scoreTokens(qs, words, catWords);
  if (total === 0 && qs.length > 1) {
    for (let i = 0; i < qs.length - 1; i++) {
      const merged = [...qs.slice(0, i), qs[i] + qs[i + 1], ...qs.slice(i + 2)];
      total = Math.max(total, scoreTokens(merged, words, catWords) * 0.9);
    }
  }
  if (total === 0) return 0;
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
