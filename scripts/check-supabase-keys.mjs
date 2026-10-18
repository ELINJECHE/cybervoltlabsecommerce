// Runs before every `npm run build` (local and Netlify). Refuses to build while the site still
// uses the legacy anon key (a JWT starting "eyJ"): on 2026-10-17 the legacy service_role key was
// exposed, and the fix is to move to the new publishable/secret keys and disable the legacy ones.
// Once NEXT_PUBLIC_SUPABASE_ANON_KEY holds the new "sb_publishable_..." key, this passes.
import { readFileSync, existsSync } from "node:fs";

function fromEnvFiles(name) {
  for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fromEnvFiles("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (key.startsWith("eyJ")) {
  console.error(
    "\n✋ Build blocked: the site still uses the legacy Supabase anon key.\n" +
      "   Switch NEXT_PUBLIC_SUPABASE_ANON_KEY to the new publishable key (sb_publishable_...)\n" +
      "   here and in Netlify, disable the legacy JWT keys in Supabase, then build again.\n"
  );
  process.exit(1);
}
