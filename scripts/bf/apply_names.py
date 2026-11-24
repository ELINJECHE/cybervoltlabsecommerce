"""Rename products from a [[old, new], ...] file (WRITES unless --dry-run).

  python3 scripts/bf/apply_names.py intake/name-fixes-2026-11-16.json --dry-run     (public key, read-only)
  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/apply_names.py intake/name-fixes-2026-11-16.json

A name only changes if exactly one product still has the old name; slugs/URLs are never touched. Old names are
saved to intake/rollback-names-<date>.json before anything is written.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DRY = "--dry-run" in sys.argv
FILE = next((a for a in sys.argv[1:] if not a.startswith("--")), None) or sys.exit("usage: apply_names.py <fixes.json> [--dry-run]")
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

rows, start = [], 0
while True:
    chunk = call(urllib.request.Request(f"{BASE}/rest/v1/products?select=id,name", headers=dict(H, Range=f"{start}-{start + 999}")))
    rows += chunk
    if len(chunk) < 1000: break
    start += 1000
by_name = {}
for r in rows: by_name.setdefault(r["name"], []).append(r)

todo, skip = [], []
for old, new in json.load(open(os.path.join(ROOT, FILE))):
    m = by_name.get(old, [])
    if len(m) != 1: skip.append((old, f"{len(m)} products have this exact name")); continue
    if by_name.get(new): skip.append((old, "new name already used by another product")); continue
    todo.append((m[0], new))
print(f"to rename: {len(todo)} | skipped: {len(skip)}")
for s in skip: print("  skip:", s)
if DRY:
    for r, new in todo[:5]: print(f"   {r['name'][:48]:48} -> {new}")
    sys.exit("dry run: nothing written")
json.dump([{"id": r["id"], "old_name": r["name"]} for r, _ in todo],
          open(os.path.join(ROOT, "intake", f"rollback-names-{time.strftime('%Y-%m-%d')}.json"), "w"), indent=1)
done = 0
for r, new in todo:
    q = f"id=eq.{urllib.parse.quote(r['id'])}&name=eq.{urllib.parse.quote(r['name'])}"
    done += len(call(urllib.request.Request(f"{BASE}/rest/v1/products?{q}", data=json.dumps({"name": new}).encode(), headers=H, method="PATCH")))
print(f"renamed: {done}")
