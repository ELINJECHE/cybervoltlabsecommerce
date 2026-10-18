// Rebuilds docs/ERROR_CODES.md from lib/errors.ts so the key never drifts from the code.
//   node scripts/gen-error-docs.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const src = readFileSync("lib/errors.ts", "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2019" } }).outputText;
const mod = { exports: {} };
new Function("module", "exports", js)(mod, mod.exports);

const rows = Object.entries(mod.exports.ERROR_CODES)
  .map(([code, v]) => `| \`${code}\` | ${v.meaning} | ${v.customer} |`)
  .join("\n");

writeFileSync(
  "docs/ERROR_CODES.md",
  `# Error codes

Generated from \`lib/errors.ts\` (run \`node scripts/gen-error-docs.mjs\` after changing it).

When something fails, customers see a plain sentence and a reference code, with a WhatsApp link that
already quotes the code. The technical error goes to the browser console only, and the code (never
personal data) is sent as an analytics event named \`app_error\`. Staff screens show the code plus the
real detail. Mistakes the customer can fix, such as a wrong password, are shown specifically and have no
code.

| Code | What it means (for you) | What the customer sees |
|---|---|---|
${rows}

## How to use this
- A customer messages you a code: find it above, then check the item under "What it means".
- **CV-AUTH-01** after a key change means the site was built with an old or disabled Supabase key.
  Rebuild with the current key.
- **CV-ORDER-01 / 02** point at the order sheet: the web-app address in the build settings, or the Apps Script deployment.
- To add a code, add it to \`ERROR_CODES\` in \`lib/errors.ts\` and regenerate this file. Keep the list short.
`
);
console.log("wrote docs/ERROR_CODES.md");
