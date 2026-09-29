import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

// A dummy project keeps createClient() from throwing when env vars are
// unset (e.g. local dev before Supabase is wired up) — every call site
// checks `supabaseEnabled` first, so these credentials are never used.
//
// The custom fetch below forces `cache: "no-store"` in development ONLY.
// Next.js patches the global `fetch` inside Server Components to cache
// responses by default — in `next dev`, a long-running process, that froze
// the very first query's result into Next's Data Cache forever (surviving
// even restarts, since the cache lives in `.next/cache` on disk). But
// `no-store` also makes Next refuse to statically render the page at all —
// fine for dev, but fatal for a static export build (`output: "export"`),
// where it silently fails every Supabase fetch and falls back to the local
// JSON, meaning admin-added products would never reach the deployed site.
// A one-shot `next build` doesn't have the "stale forever" problem in the
// first place, so it can use Next's normal (safe, one-fetch-per-build) cache.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
    global: {
      fetch:
        process.env.NODE_ENV === "development"
          ? (input, init) => fetch(input, { ...init, cache: "no-store" })
          : fetch,
    },
  }
);
