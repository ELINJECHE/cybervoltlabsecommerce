"""Add the drafted product descriptions (WRITES to the database unless --dry-run).

  python3 scripts/bf/apply_descriptions.py --dry-run                      (reads with the public key)
  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/apply_descriptions.py

A description is only set where the product matches by exact name (current or pre-rename name), is the only
product with that name, and has NO description yet. Existing descriptions are never overwritten.
Old values (empty) are logged to intake/rollback-descriptions-<date>.json.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DRY = "--dry-run" in sys.argv
E = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env.local")) if "=" in l and not l.startswith("#"))
BASE = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = E["NEXT_PUBLIC_SUPABASE_ANON_KEY"] if DRY else (os.environ.get("SUPABASE_SECRET_KEY") or sys.exit("set SUPABASE_SECRET_KEY for this one run"))
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

rows, start = [], 0
while True:
    req = urllib.request.Request(f"{BASE}/rest/v1/products?select=id,name,description", headers=dict(H, Range=f"{start}-{start + 999}"))
    chunk = json.loads(urllib.request.urlopen(req, timeout=60).read()); rows += chunk
    if len(chunk) < 1000: break
    start += 1000
by_name = {}
for r in rows: by_name.setdefault(r["name"], []).append(r)

drafts = json.load(open(os.path.join(ROOT, "intake", "descriptions-2026-10-25.json")))
drafts = list(drafts.items()) if isinstance(drafts, dict) else drafts
# names in the draft may be pre-rename; map them through the name-fix file too
fixes = json.load(open(os.path.join(ROOT, "intake", "name-fixes-2026-10-25.json")))
fixes = dict(fixes.items() if isinstance(fixes, dict) else fixes)

todo, skip = [], []
for name, text in drafts:
    m = by_name.get(name) or by_name.get(fixes.get(name, ""), [])
    if len(m) != 1: skip.append((name, f"{len(m)} products match")); continue
    if (m[0].get("description") or "").strip(): skip.append((name, "already has a description")); continue
    todo.append((m[0], text))

print(f"to set: {len(todo)} | skipped: {len(skip)}")
for s in skip: print("  skip:", s)
if DRY: sys.exit("dry run: nothing written")
json.dump([{"id": r["id"], "old_description": r.get("description")} for r, _ in todo],
          open(os.path.join(ROOT, "intake", f"rollback-descriptions-{time.strftime('%Y-%m-%d')}.json"), "w"), indent=1)
done = 0
for r, text in todo:
    q = f"/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}&description=is.null"
    for filt in (q, f"/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}&description=eq."):   # null or empty
        req = urllib.request.Request(BASE + filt, data=json.dumps({"description": text}).encode(), headers=H, method="PATCH")
        try:
            out = json.loads(urllib.request.urlopen(req, timeout=60).read() or b"[]")
        except urllib.error.HTTPError as e: sys.exit(f"HTTP {e.code}: {e.read()[:200]}")
        if out: done += 1; break
print(f"applied: {done} descriptions")
