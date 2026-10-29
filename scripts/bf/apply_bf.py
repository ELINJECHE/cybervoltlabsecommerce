"""Apply the approved Black Friday cuts and catalogue name fixes (WRITES to the database).

  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/apply_bf.py [--dry-run]

Safety: a name is only changed if the product still has exactly the old name; a cut is only set if the product's
price is still the one in the plan and it has no discount yet. Old values go to intake/rollback-bf-<date>.json first.
Slugs/URLs are never changed.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DRY = "--dry-run" in sys.argv
E = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env.local")) if "=" in l and not l.startswith("#"))
BASE = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ.get("SUPABASE_SECRET_KEY") or sys.exit("set SUPABASE_SECRET_KEY for this one run")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

def call(method, path, body=None):
    for i in range(4):
        try:
            req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers=H, method=method)
            with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b"[]")
        except urllib.error.HTTPError as e: sys.exit(f"HTTP {e.code} on {method} {path.split('?')[0]}: {e.read()[:200]}")
        except Exception:
            if i == 3: raise
            time.sleep(2 * (i + 1))

rows, start = [], 0
while True:
    req = urllib.request.Request(f"{BASE}/rest/v1/products?select=id,name,price,discount_price", headers=dict(H, Range=f"{start}-{start + 999}"))
    chunk = json.loads(urllib.request.urlopen(req, timeout=60).read()); rows += chunk
    if len(chunk) < 1000: break
    start += 1000
by_id = {r["id"]: r for r in rows}
by_name = {}
for r in rows: by_name.setdefault(r["name"], []).append(r)

plan = json.load(open(os.path.join(ROOT, "intake", "bf-discount-plan.json")))
fixes = json.load(open(os.path.join(ROOT, "intake", "name-fixes-2026-10-25.json")))
fixes = fixes.items() if isinstance(fixes, dict) else fixes

cuts, cut_skip = [], []
for c in plan:
    r = by_id.get(c["id"])
    if not r: cut_skip.append((c["name"], "product gone")); continue
    if r["discount_price"]: cut_skip.append((r["name"], "already has a discount")); continue
    if r["price"] != c["was"]: cut_skip.append((r["name"], f"price is now {r['price']}, plan was {c['was']}")); continue
    cuts.append((r, c["now"]))

renames, ren_skip = [], []
for old, new in fixes:
    m = by_name.get(old, [])
    if len(m) != 1: ren_skip.append((old, f"{len(m)} products have this exact name")); continue
    if old != new: renames.append((m[0], new))

rollback = {"discounts": [{"id": r["id"], "old_discount_price": r["discount_price"]} for r, _ in cuts],
            "names": [{"id": r["id"], "old_name": r["name"]} for r, _ in renames]}
rb = os.path.join(ROOT, "intake", f"rollback-bf-{time.strftime('%Y-%m-%d')}.json")
print(f"to apply: {len(cuts)} cuts, {len(renames)} renames | skipped: {len(cut_skip)} cuts, {len(ren_skip)} renames")
for s in cut_skip + ren_skip: print("  skip:", s)
if DRY: sys.exit("dry run: nothing written")
json.dump(rollback, open(rb, "w"), indent=1)

done_c = done_n = 0
for r, now in cuts:
    out = call("PATCH", f"/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}&discount_price=is.null", {"discount_price": now})
    done_c += len(out)
for r, new in renames:
    out = call("PATCH", f"/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}&name=eq.{urllib.parse.quote(r['name'])}", {"name": new})
    done_n += len(out)
print(f"applied: {done_c} cuts, {done_n} renames. Rollback saved to {os.path.relpath(rb, ROOT)}")
