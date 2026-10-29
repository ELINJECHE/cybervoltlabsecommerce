"""Add Omar Electronics to the Black Friday cuts and remove the duplicate Marwa set (WRITES unless --dry-run).

  python3 scripts/bf/apply_omar_marwa.py --dry-run                   (public key, read-only)
  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/apply_omar_marwa.py

Omar: no supplier cost is recorded, so (owner's instruction) his current prices are treated as cost + 40%:
cost = price / 1.4, floor = cost + 20%, i.e. the same 14% cap as everything else. "Was" = today's price.
Marwa: of the two 30-piece sets, the one with the LOWER margin is removed (ties: the newer one); its row is saved to
intake/rollback-omar-marwa-<date>.json first.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DRY = "--dry-run" in sys.argv
E = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env.local")) if "=" in l and not l.startswith("#"))
BASE = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = E["NEXT_PUBLIC_SUPABASE_ANON_KEY"] if DRY else (os.environ.get("SUPABASE_SECRET_KEY") or sys.exit("set SUPABASE_SECRET_KEY for this one run"))
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
MARKUP, FLOOR, MAX_OFF, MIN_OFF = 40, 20, 15, 8

def get(path):
    out, start = [], 0
    while True:
        req = urllib.request.Request(BASE + "/rest/v1/" + path, headers=dict(H, Range=f"{start}-{start + 999}"))
        chunk = json.loads(urllib.request.urlopen(req, timeout=60).read()); out += chunk
        if len(chunk) < 1000: return out
        start += 1000

def patch(path, body, method="PATCH"):
    req = urllib.request.Request(BASE + "/rest/v1/" + path, data=None if body is None else json.dumps(body).encode(), headers=H, method=method)
    try: return json.loads(urllib.request.urlopen(req, timeout=60).read() or b"[]")
    except urllib.error.HTTPError as e: sys.exit(f"HTTP {e.code}: {e.read()[:200]}")

products = get("products?select=*")
by_id = {p["id"]: p for p in products}

# Omar rows are identified by the admin-only sourcing table; in dry-run (public key) fall back to the known id list.
if DRY:
    omar_ids = None
else:
    omar_ids = [s["product_id"] for s in get("product_sourcing?select=product_id,supplier") if "omar" in s["supplier"].lower()]

if omar_ids is None:
    omar = [p for p in products if p["category"] in ("electronics", "audio-speakers") and not p["discount_price"]]
    print("(dry run: Omar rows guessed from category; the real run uses the sourcing table)")
else:
    omar = [by_id[i] for i in omar_ids if i in by_id]

cuts, skip = [], []
for p in omar:
    if p["discount_price"]: skip.append((p["name"], "already discounted")); continue
    cost = p["price"] / (1 + MARKUP / 100)
    floor = cost * (1 + FLOOR / 100)
    room = (1 - floor / p["price"]) * 100
    if room < MIN_OFF: skip.append((p["name"], "no room")); continue
    off = min(MAX_OFF, int(room))
    new = max(int(p["price"] * (1 - off / 100) // 10 * 10), -(-int(floor) // 10) * 10)
    if new >= p["price"]: skip.append((p["name"], "rounding left no cut")); continue
    cuts.append((p, new))
print(f"Omar cuts: {len(cuts)} (skipped {len(skip)})")
for p, new in cuts[:6]: print(f"   {p['name'][:42]:42} {p['price']:>6} -> {new:>6}")

# Marwa duplicate
marwa = [p for p in products if "marwa" in p["name"].lower() and "30" in p["name"]]
print("Marwa candidates:", [(p["name"], p["price"]) for p in marwa])
remove = None
if len(marwa) == 2:
    if DRY: print("(dry run: margin needs the admin-only costs; the real run picks the lower-margin set)")
    else:
        cost = {s["product_id"]: s["supplier_cost"] for s in get("product_sourcing?select=product_id,supplier_cost")}
        def margin(p):
            c = cost.get(p["id"]); eff = p["discount_price"] or p["price"]
            return (eff - c) / c if c else 99
        marwa.sort(key=lambda p: (margin(p), p["created_at"]), reverse=False)
        remove = marwa[0]
        print(f"Marwa: margins {[(p['name'][:30], round(margin(p) * 100)) for p in marwa]} -> removing '{remove['name']}'")
if DRY: sys.exit("dry run: nothing written")

rb = os.path.join(ROOT, "intake", f"rollback-omar-marwa-{time.strftime('%Y-%m-%d')}.json")
json.dump({"omar_cut_ids": [p["id"] for p, _ in cuts], "removed_product_row": remove}, open(rb, "w"), indent=1, default=str)
done = 0
for p, new in cuts:
    done += len(patch(f"products?id=eq.{urllib.parse.quote(p['id'])}&discount_price=is.null", {"discount_price": new}))
print(f"applied: {done} Omar cuts")
if remove:
    out = patch(f"products?id=eq.{urllib.parse.quote(remove['id'])}", None, method="DELETE")
    print(f"removed {len(out)} Marwa product: {remove['name']} (row saved in {os.path.relpath(rb, ROOT)})")
