"""Replace placeholder descriptions (WRITES unless --dry-run).

  python3 scripts/bf/apply_description_fixes.py intake/description-fixes-2026-11-23.json --dry-run   (public key, read-only)
  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/apply_description_fixes.py intake/description-fixes-2026-11-23.json

File: [{"slug", "expected_current", "new"}]. A description only changes if the product still has exactly the expected
current text, so anything edited in the meantime is never overwritten. Old text is saved to
intake/rollback-description-fixes-<date>.json first.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DRY = "--dry-run" in sys.argv
FILE = next((a for a in sys.argv[1:] if not a.startswith("--")), None) or sys.exit("usage: apply_description_fixes.py <fixes.json> [--dry-run]")
E = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env.local")) if "=" in l and not l.startswith("#"))
BASE = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = E["NEXT_PUBLIC_SUPABASE_ANON_KEY"] if DRY else (os.environ.get("SUPABASE_SECRET_KEY") or sys.exit("set SUPABASE_SECRET_KEY for this one run"))
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

def call(req):
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b"[]")
        except urllib.error.HTTPError as e: sys.exit(f"HTTP {e.code}: {e.read()[:200]}")
        except Exception:
            if i == 3: raise
            time.sleep(2 * (i + 1))

todo, skip = [], []
for f in json.load(open(os.path.join(ROOT, FILE))):
    rows = call(urllib.request.Request(f"{BASE}/rest/v1/products?select=id,slug,description&slug=eq.{urllib.parse.quote(f['slug'])}", headers=H))
    if len(rows) != 1: skip.append((f["slug"], f"{len(rows)} products with this slug")); continue
    if (rows[0]["description"] or "").strip() != f["expected_current"]: skip.append((f["slug"], "description was changed since the draft")); continue
    todo.append((rows[0], f["new"]))
print(f"to update: {len(todo)} | skipped: {len(skip)}")
for s in skip: print("  skip:", s)
if DRY: sys.exit("dry run: nothing written")
json.dump([{"id": r["id"], "slug": r["slug"], "old_description": r["description"]} for r, _ in todo],
          open(os.path.join(ROOT, "intake", f"rollback-description-fixes-{time.strftime('%Y-%m-%d')}.json"), "w"), indent=1)
done = 0
for r, new in todo:
    q = f"id=eq.{urllib.parse.quote(r['id'])}&description=eq.{urllib.parse.quote(r['description'])}"
    done += len(call(urllib.request.Request(f"{BASE}/rest/v1/products?{q}", data=json.dumps({"description": new}).encode(), headers=H, method="PATCH")))
print(f"updated: {done}")
