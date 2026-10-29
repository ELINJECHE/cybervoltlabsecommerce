"""Black Friday real-discount planner (READ-ONLY: it never writes to the database).

Reads products + admin-only supplier costs, picks products with room to cut, and writes a preview sheet:
  exports/black_friday_discounts.xlsx   (you review, mark YES/NO)
  intake/bf-discount-plan.json          (what `apply` would set; "was" price = today's real price)

Rules (honest-pricing): the "was" price is the price the product sells at today; the new price never goes below
supplier cost + FLOOR_MARGIN%; products already discounted are left alone. (Stock isn't tracked: every row reads 0.)

Run:  SUPABASE_SECRET_KEY=sb_secret_... python3 scripts/bf/discount_plan.py
"""
import collections, json, os, sys, urllib.request, urllib.parse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
FLOOR_MARGIN = 20      # never sell below cost + 20%
MAX_OFF = 15           # biggest cut we advertise
MIN_OFF = 8            # smaller than this isn't worth a badge
TARGET = 50            # how many products to feature
MIN_PRICE = 1200       # a cut on cheap items is just noise
PER_CATEGORY = 6

def env():
    d = {}
    for line in open(os.path.join(ROOT, ".env.local")):
        if "=" in line and not line.startswith("#"):
            k, v = line.strip().split("=", 1); d[k] = v.strip('"')
    return d

E = env()
BASE = E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ.get("SUPABASE_SECRET_KEY") or sys.exit("set SUPABASE_SECRET_KEY for this one run")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

def get_all(table, select):
    out, start = [], 0
    while True:
        h = dict(H, Range=f"{start}-{start + 999}")
        req = urllib.request.Request(f"{BASE}/rest/v1/{table}?select={urllib.parse.quote(select)}", headers=h)
        with urllib.request.urlopen(req, timeout=60) as r:
            rows = json.loads(r.read())
        out += rows
        if len(rows) < 1000: return out
        start += 1000

products = get_all("products", "id,slug,name,category,price,discount_price,stock,images,is_deal")
sourcing = {r["product_id"]: r for r in get_all("product_sourcing", "product_id,supplier,supplier_cost")}
print(f"{len(products)} products, {len(sourcing)} with a recorded supplier")

def nice(p):                     # tidy shelf price: round DOWN to the nearest 10, ending in 0
    return int(p // 10 * 10)

cands, skipped = [], collections.Counter()
for p in products:
    if p.get("discount_price"): skipped["already discounted"] += 1; continue
    if p["price"] < MIN_PRICE: skipped["under KSh %d" % MIN_PRICE] += 1; continue
    s = sourcing.get(p["id"]); cost = (s or {}).get("supplier_cost")
    if not cost: skipped["no supplier cost recorded"] += 1; continue
    floor = cost * (1 + FLOOR_MARGIN / 100)
    room = 1 - floor / p["price"]
    if room * 100 < MIN_OFF: skipped["no room above cost+20%"] += 1; continue
    off = min(MAX_OFF, int(room * 100))
    new = max(nice(p["price"] * (1 - off / 100)), -(-int(floor) // 10) * 10)
    if new >= p["price"]: skipped["rounding left no cut"] += 1; continue
    pct = round((1 - new / p["price"]) * 100)
    cands.append(dict(id=p["id"], slug=p["slug"], name=p["name"], category=p["category"], supplier=s["supplier"], cost=cost,
                      was=p["price"], now=new, off=pct, margin=round((new - cost) / cost * 100), photo=(p["images"] or [None])[0]))

print("skipped:", dict(skipped), "| eligible:", len(cands))

# spread across categories, most expensive first (a cut means more on a dearer item)
by_cat = collections.defaultdict(list)
for c in sorted(cands, key=lambda c: -c["was"]): by_cat[c["category"]].append(c)
picked = []
for rnd in range(PER_CATEGORY):
    for cat in sorted(by_cat, key=lambda k: -len(by_cat[k])):
        if rnd < len(by_cat[cat]) and len(picked) < TARGET: picked.append(by_cat[cat][rnd])
picked.sort(key=lambda c: (c["category"], -c["was"]))

os.makedirs(os.path.join(ROOT, "intake"), exist_ok=True); os.makedirs(os.path.join(ROOT, "exports"), exist_ok=True)
json.dump(picked, open(os.path.join(ROOT, "intake", "bf-discount-plan.json"), "w"), indent=1)

wb = Workbook(); ws = wb.active; ws.title = "Black Friday cuts"
head = ["Decision", "Product", "Category", "Supplier", "Today's price (becomes 'was')", "Black Friday price", "% off", "Your margin after cut", "Cost (private)", "Slug"]
ws.append(head)
for c in picked:
    ws.append(["YES", c["name"], c["category"], c["supplier"], c["was"], c["now"], c["off"], f'{c["margin"]}%', c["cost"], c["slug"]])
for cell in ws[1]:
    cell.font = Font(bold=True, color="FFFFFF"); cell.fill = PatternFill("solid", fgColor="14142A"); cell.alignment = Alignment(wrap_text=True, vertical="center")
for col, w in zip("ABCDEFGHIJ", (10, 46, 20, 18, 16, 16, 8, 14, 12, 40)): ws.column_dimensions[col].width = w
ws.freeze_panes = "C2"
wb.save(os.path.join(ROOT, "exports", "black_friday_discounts.xlsx"))

print(f"picked {len(picked)} across {len({c['category'] for c in picked})} categories; "
      f"cuts {min(c['off'] for c in picked)}-{max(c['off'] for c in picked)}%; "
      f"lowest margin after cut {min(c['margin'] for c in picked)}%")
for cat, n in collections.Counter(c["category"] for c in picked).most_common(): print(f"  {n:2d}  {cat}")
