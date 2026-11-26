"""Build the Google Merchant Center product feed from the shop database (READ-ONLY, uses the public key).

  python3 scripts/gmc/build_feed.py            only products marked "gmc": true in data/merchant-attributes.json
  python3 scripts/gmc/build_feed.py --all      every product (many will have warnings: no brand, thin descriptions)

Writes exports/gmc_feed_<date>.tsv (upload it as a file feed, or paste into a Google Sheet) and
exports/gmc_feed_<date>_notes.txt (what still needs attention, row by row).

The feed's `id` is the product's database ID, exactly the `sku` in the page's structured data (and the Product ID column of
Cybervolt_Products_Final.xlsx). Size variants get "<id>-<size>" and share item_group_id = <id>.
Everything here mirrors lib/seo.ts: change a rule in one place, change it in the other.
"""
import csv, io, json, os, re, sys, time, urllib.request
from datetime import datetime, timezone
try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
ALL = "--all" in sys.argv
E = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env.local")) if "=" in l and not l.startswith("#"))
BASE, KEY = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), E["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
SITE = "https://cybervoltlabs.co.ke"
BF_WINDOW = "2026-10-30T00:00+0300/2026-11-30T23:59+0300"   # lib/blackfriday.ts BF_START / BF_END
BF_END = datetime(2026, 11, 30, 23, 59, 59, tzinfo=timezone(__import__("datetime").timedelta(hours=3)))

def fetch(url, tries=5, headers=None):
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=headers or {"User-Agent": "Mozilla/5.0"}), timeout=60).read()
        except Exception:
            if i == tries - 1: raise
            time.sleep(2 * (i + 1))

attrs = {k: v for k, v in json.load(open(os.path.join(ROOT, "data", "merchant-attributes.json"))).items() if not k.startswith("_")}
rows, start = [], 0
while True:
    chunk = json.loads(fetch(f"{BASE}/rest/v1/products?select=*&order=name", headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Range": f"{start}-{start + 999}"}))
    rows += chunk
    if len(chunk) < 1000: break
    start += 1000

COLS = ["id", "item_group_id", "title", "description", "link", "image_link", "additional_image_link", "price", "sale_price",
        "sale_price_effective_date", "availability", "condition", "brand", "mpn", "gtin", "identifier_exists", "size", "product_type"]
out, notes = [], []
def note(r, msg): notes.append(f'{r["name"]}  [{r["id"][:8]}]: {msg}')

sale_end_soon = datetime.now(timezone.utc) < BF_END
for r in rows:
    a = attrs.get(r["slug"], {})
    if not ALL and not a.get("gmc"): continue
    price = r["price"]; sale = r.get("discount_price")
    on_sale = sale is not None and sale < price
    desc = (r.get("description") or "").strip()
    imgs = r.get("images") or []
    cond = a.get("condition", "refurbished" if re.search("refurb", r["name"], re.I) else "new")
    deal_end = r.get("deal_ends_at")
    window = ""
    if on_sale:
        if r.get("is_deal") and deal_end and deal_end > datetime.now(timezone.utc).isoformat(): window = f'{datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00+0000")}/{deal_end[:16]}+0000'
        elif sale_end_soon: window = BF_WINDOW
        else: note(r, "on sale but no end date (Black Friday is over): add a deal end date or clear the discount")
    brand, mpn = a.get("brand", ""), a.get("mpn", "")
    ident = "" if (brand and mpn) else ("no" if not brand else "")
    if brand and not mpn: note(r, "has a brand but no GTIN/MPN: read the barcode (GTIN) off the box and add it, or leave blank and Google may limit it")
    if not brand: note(r, "no brand: sent with identifier_exists = no (fine for genuinely unbranded items)")
    if len(desc) < 120: note(r, f"description is only {len(desc)} characters: write a real one (aim for 150+)")
    if r["name"] == r["name"].lower() or r["name"][:1].islower(): note(r, "title starts in lower case")
    if r.get("stock", 0) < 0: pass
    # sizes -> one row per size, same group
    sizes = a.get("sizes") or [None]
    for size in sizes:
        out.append({
            "id": r["id"] if size is None else f'{r["id"]}-{size}',
            "item_group_id": "" if size is None else r["id"],
            "title": r["name"], "description": desc,
            "link": f'{SITE}/product/{r["slug"]}' + ("" if size is None else f"?size={size}"),
            "image_link": imgs[0] if imgs else "", "additional_image_link": ",".join(imgs[1:11]),
            "price": f"{price} KES", "sale_price": f"{sale} KES" if on_sale else "", "sale_price_effective_date": window,
            "availability": "out_of_stock" if r.get("stock", 0) < 0 else "in_stock", "condition": cond,
            "brand": brand, "mpn": mpn, "gtin": "", "identifier_exists": ident, "size": size or "", "product_type": r["category"],
        })
    # image checks (Google: 500 x 500 px minimum, enforced from 31 Jan 2027)
    if not imgs: note(r, "NO IMAGE")
    elif Image:
        for j, u in enumerate(imgs[:6]):
            try:
                w, h = Image.open(io.BytesIO(fetch(u))).size
                if w < 500 or h < 500: note(r, f'image {j + 1} is {w}x{h}px: below the 500x500 minimum')
            except Exception as e:
                note(r, f"image {j + 1} could not be read: {e}")

stamp = time.strftime("%Y-%m-%d")
os.makedirs(os.path.join(ROOT, "exports"), exist_ok=True)
fp = os.path.join(ROOT, "exports", f"gmc_feed_{stamp}.tsv")
with open(fp, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=COLS, delimiter="\t", quoting=csv.QUOTE_MINIMAL); w.writeheader(); w.writerows(out)
open(os.path.join(ROOT, "exports", f"gmc_feed_{stamp}_notes.txt"), "w", encoding="utf-8").write("\n".join(notes) + "\n")
print(f"{len(out)} feed rows from {len({o['item_group_id'] or o['id'] for o in out})} products -> {os.path.relpath(fp, ROOT)}")
print(f"{len(notes)} notes -> exports/gmc_feed_{stamp}_notes.txt")
