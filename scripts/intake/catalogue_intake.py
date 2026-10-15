#!/usr/bin/env python3
"""Supplier WhatsApp chat exports -> review sheet -> catalogue.  See docs/CATALOGUE_INTAKE.md.

  scan      find new "WhatsApp Chat - <supplier>.zip" exports, parse the posts and write a review
            spreadsheet (intake/review/*.xlsx). Needs no secrets and never touches the live shop.
  contact   make labelled contact sheets of photo-only posts so they can be named by eye.
  setnames  fill product names into a review sheet (used for photo-only posts).
  apply     push rows you marked ADD / UPDATE PRICE to the shop. Needs SUPABASE_SERVICE_KEY in the
            environment for that one run; the key is never stored anywhere.

Third-party chats and photos stay in intake/ (git-ignored) and are never published.
"""
import argparse, glob, hashlib, json, os, re, shutil, sys, time, uuid, zipfile, datetime, collections
import urllib.request, urllib.error
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import openpyxl
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CFG = json.load(open(os.path.join(HERE, "config.json")))

# ---------------------------------------------------------------- site knowledge
CATEGORIES = {  # slug -> keywords that suggest it (first match wins, order matters)
    "sneakers-shoes": r"sneaker|puma|nike|adidas|vans|jordan|\bboots?\b|dunk|air ?max|air ?force|shox|timberland|clarks|wallabee|lugz|new balance|dr martens|samba|campus|sandals?|casuals?|brogues?|loafers?|trainers?|\bshoes?\b|mules|slides|crocs",
    "motorcycle-gear": r"helmet|knee guard|elbow guard|riding|gloves|reflective|rain suit|motocross|motorcycle|biker",
    "audio-speakers": r"speaker|soundbar|woofer|home theat|audio system|headphone|earbud|microphone|\bmic\b",
    "home-appliances": r"microwave|washing machine|twin tub|cooker|stove|\bfan\b|heater|vacuum|steam cleaner|kettle|blender|roti|fridge|refrigerator|\boven\b|hot ?plate|iron box|air ?fryer|dispenser",
    "personal-care": r"shaver|clipper|trimmer|blow ?dryer|hair dryer|straightener|perfume|body mist|gift set",
    "kitchen-dining": r"cutlery|cookware|\bpots?\b|\bpans?\b|lunch box|mug|plates?|glasses|jar|flask|bottle|dinner set|sugar dish",
    "interior-design": r"curtain|blanket|duvet|bed ?sheet|pillow|flower|vase|carpet|rug|wall (?:art|decor)|mirror",
    "home-storage": r"\brack\b|organi[sz]er|hanger|shoe slot|storage|basket|luggage|suitcase",
    "tools-car-care": r"drill|tool box|ladder|\btape\b|lock box|floodlight|solar|car wash|foam cleaner|screwdriver",
    "sports-leisure": r"skateboard|skates|camping|umbrella|football|gym|dumbbell|yoga",
    "furniture": r"\btable\b|\bchair\b|sofa|\bbed\b|wardrobe|shelf|desk",
    "electronics": r"watch|router|wifi|calculator|extension|tripod|tv (?:bracket|mount)|bracket|phone|power ?bank|charger|cable|camera|smart|bluetooth|tablet|laptop",
}
DESC = {
    "sneakers-shoes": "Comfortable everyday footwear.", "audio-speakers": "Sound that fills the room.",
    "home-appliances": "A dependable appliance for your home.", "electronics": "A practical gadget for home, office or on the go.",
    "tools-car-care": "A handy tool for the job.", "personal-care": "Personal grooming made easy.",
    "motorcycle-gear": "Riding gear built for the road.", "kitchen-dining": "For your kitchen and table.",
    "home-storage": "Keeps your space tidy and organised.", "interior-design": "Finishing touches for your home.",
    "sports-leisure": "For play and the outdoors.", "furniture": "Furniture for your home or office.",
}
BIG_BRANDS = re.compile(r"(?i)\b(nike|adidas|puma|new balance|vans|jordan|timberland|clarks|dr\.? ?martens|lugz|cat|converse|skechers|reebok|under armour|on cloud|air ?max|air ?force)\b")
GREETING = re.compile(r"(?i)\b(good morning|happy (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|blessings?|prayer|amen|father|lord|heavenly|almighty|god|happy new)\b")
EMO = re.compile(r"[\U00010000-\U0010ffff☀-➿⬀-⯿️‍]")


def cfg_path(p):
    return os.path.expanduser(p)


def work_root(args):
    return os.path.abspath(args.work) if getattr(args, "work", None) else os.path.join(ROOT, CFG["work_dir"])


def load_env():
    env = {}
    p = os.path.join(ROOT, ".env.local")
    if os.path.exists(p):
        for line in open(p):
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1); env[k] = v
    return env


def http(method, url, headers, data=None, tries=4):
    for i in range(tries):
        try:
            r = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(r, timeout=60) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()
        except Exception:
            if i == tries - 1: raise
            time.sleep(2 * (i + 1))


def live_products():
    env = load_env()
    base, key = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not base or not key:
        return []
    st, body = http("GET", f"{base}/rest/v1/products?select=id,slug,name,price,category", {"apikey": key, "Authorization": "Bearer " + key})
    return json.loads(body) if st == 200 else []


# ---------------------------------------------------------------- parsing
LINE = [  # iOS:  [25/07/2026, 16:53:12] Name: text      Android:  25/07/2026, 16:53 - Name: text
    re.compile(r"^\[(\d{1,2})/(\d{1,2})/(\d{2,4}), (\d{1,2}):(\d{2})(?::\d{2})?\s?(?:[AP]M)?\] ([^:]+): (.*)$", re.S),
    re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4}), (\d{1,2}):(\d{2})(?:\s?[AP]M)? - ([^:]+): (.*)$", re.S),
]
ATTACH = re.compile(r"<attached: ([^>]+)>|^(IMG-[\w-]+\.(?:jpg|jpeg|png|webp)) \(file attached\)", re.M)
START = re.compile(r"(?m)^(?=\[?\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2})")


def parse_chat(text):
    text = text.replace("‎", "").replace(" ", " ")
    msgs = []
    for block in START.split(text):
        block = block.strip("\n")
        for rx in LINE:
            m = rx.match(block)
            if m:
                d, mo, y, H, M, sender, body = m.groups()
                y = int(y) + (2000 if int(y) < 100 else 0)
                try:
                    ts = datetime.datetime(y, int(mo), int(d), int(H), int(M))
                except ValueError:
                    break
                msgs.append({"ts": ts, "sender": sender.strip("⁦⁩‪‬ ").strip(), "body": body})
                break
    return msgs


def clean_text(b):
    return re.sub(r"\s+", " ", ATTACH.sub("", b)).strip()


PRICE_PATTERNS = re.compile(
    r"(?:@|=|ksh\.?s?|kes|price|only|now|selling)\s*[:\-]?\s*(\d{1,3}(?:,\d{3})+|\d{3,6})(?:\s*/=|/-)?"
    r"|(\d{1,3}(?:,\d{3})+|\d{3,6})\s*(?:/=|/-|ksh|bob)|(\d{1,3})\s?k\b|(?:^|\s)(\d{4,5})\s*$", re.I)


def prices_in(text):
    t = text.replace("*", "").replace("_", "")
    out = []
    for m in PRICE_PATTERNS.finditer(t):
        g = [x for x in m.groups() if x]
        if not g: continue
        v = int(g[0].replace(",", ""))
        if m.group(3): v *= 1000
        if 50 <= v <= 2_000_000: out.append(v)
    return out


def clean_name(t):
    t = EMO.sub("", t).replace("*", "").replace("_", "").replace("~", " ")
    t = re.sub(r"(?i)\b(restocked|new in|new arrivals?|back in stock|now available|available|price drop|offer price:?|wholesale price|quality|hot deal|limited stock|original|genuine|authentic)\b", "", t)
    t = re.sub(r"(?i)\bsizes?\s*[:\-]?\s*[\d, \-]+", "", t)
    t = re.sub(r"(?i)(@|=|ksh\.?s?|price|only|now|selling)\s*[:\-]?\s*[\d,\.]+\s*(/=|/-|k)?", "", t)
    t = re.sub(r"\d{9,12}", "", t)
    t = re.sub(r"\s+", " ", t).strip(" -:.,;!?@")
    t = re.split(r"\s[-–—•▪◼✅🔹💥]\s|[•▪◼✅]|\.\s", t)[0]
    t = re.sub(r"\s+(Comes with|Removable|Water and wind|Fully padded|Powerful|Weight|featuring|Selling|Durable|Code:)\b.*$", "", t, flags=re.I)
    return " ".join(t.split()[:9]).strip(" -:.,;!?@")


def sizes_in(t):
    m = re.search(r"(?i)sizes?\s*[:\-]?\s*(\d{2}(?:\s*[-,]\s*\d{2})*)", t)
    return re.sub(r"\s", "", m.group(1)) if m else ""


def guess_category(text):
    for slug, rx in CATEGORIES.items():
        if re.search(rx, text, re.I): return slug
    return ""


def build_items(msgs, photos_dir, supplier):
    items, last_text = [], None
    for m in sorted(msgs, key=lambda x: x["ts"]):
        if m["sender"] in CFG["skip_senders"]: continue
        photos = [a or b for a, b in ATTACH.findall(m["body"])]
        txt = clean_text(m["body"])
        if "omitted" in txt and not photos:
            continue
        if photos:
            use = txt or (last_text[1] if last_text and (m["ts"] - last_text[0]).total_seconds() <= 600 else "")
            files = [p for p in photos if os.path.exists(os.path.join(photos_dir, p)) and p.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
            if files:
                items.append({"ts": m["ts"], "text": use, "own": bool(txt), "photos": files, "sender": m["sender"]})
        elif txt and not GREETING.search(txt):
            last_text = (m["ts"], txt)
    merged = []
    for it in items:  # photos of one product posted back-to-back
        if merged and not it["own"] and (it["ts"] - merged[-1]["ts"]).total_seconds() <= 180 and (not it["text"] or it["text"] == merged[-1]["text"]):
            merged[-1]["photos"] += it["photos"]; continue
        merged.append(it)
    out = []
    for it in merged:
        if GREETING.search(it["text"]) and not prices_in(it["text"]): continue  # prayers, good-morning posters
        pr = prices_in(it["text"])
        name = clean_name(it["text"])
        out.append({"ts": it["ts"], "supplier": supplier, "text": it["text"], "name": name, "prices": pr,
                    "price": pr[0] if pr else None, "sizes": sizes_in(it["text"]), "photos": it["photos"],
                    "category": guess_category(it["text"] or name)})
    return out


def sell_price(cost, supplier=""):
    if not cost: return None
    # Your own broadcast groups already post retail prices, so no markup on those.
    retail = any(k.lower() in supplier.lower() for k in CFG["retail_price_sources"])
    p = cost * (1 + (0 if retail else CFG["markup_percent"]) / 100.0)
    step = CFG["round_up_to"]
    return max(CFG["min_sell_price"], int(-(-p // step) * step))


def tokens(s):
    stop = {"the", "and", "with", "for", "size", "pcs", "pc", "set", "kg", "black", "white", "new"}
    return {t for t in re.findall(r"[a-z0-9]+", s.lower()) if len(t) > 1 and t not in stop}


def match_live(name, live):
    a = tokens(name)
    if len(a) < 2: return None
    best = (0, None)
    for p in live:
        b = tokens(p["name"])
        if not b: continue
        j = len(a & b) / min(len(a), len(b))
        if j > best[0]: best = (j, p)
    return best[1] if best[0] >= 0.66 else None


def safe_extract(zpath, dest):
    os.makedirs(dest, exist_ok=True)
    root = os.path.realpath(dest)
    with zipfile.ZipFile(zpath) as z:
        for info in z.infolist():
            target = os.path.realpath(os.path.join(dest, info.filename))
            if not target.startswith(root + os.sep) and target != root:
                raise SystemExit(f"unsafe path in zip: {info.filename}")
        z.extractall(dest)


def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:60] or "item"


# ---------------------------------------------------------------- scan
HEAD = ["Decision", "Photo", "Item ID", "Supplier", "Posted", "Product name", "Category", "Supplier price (cost)",
        "Proposed sell price", "Final sell price", "Sizes", "Suggested", "Already on site", "Site price", "Matched product ID",
        "Photo files", "Original message", "Applied"]
COL = {h: i + 1 for i, h in enumerate(HEAD)}


def write_sheet(path, rows):
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Review"
    ws.append(HEAD)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="4D66B0"); c.alignment = Alignment(wrap_text=True, vertical="center")
    for r in rows:
        ws.append([r["decision"], None, r["id"], r["supplier"], r["posted"], r["name"], r["category"], r["cost"], r["proposed"], r["final"],
                   r["sizes"], r["suggested"], r["site_name"], r["site_price"], r["site_id"], ", ".join(r["files"]), r["text"][:400], ""])
        row = ws.max_row
        ws.row_dimensions[row].height = 70
        try:
            im = XLImage(r["thumb"]); im.width = im.height = 88
            ws.add_image(im, f"B{row}")
        except Exception:
            pass
        if r["suggested"].startswith("SKIP"):
            for c in ws[row]: c.fill = PatternFill("solid", fgColor="EEEEEE")
        elif not r["name"] or r["name"].startswith("("):
            ws.cell(row=row, column=COL["Product name"]).fill = PatternFill("solid", fgColor="FFF3CD")
    widths = {"Decision": 14, "Photo": 14, "Item ID": 14, "Supplier": 18, "Posted": 11, "Product name": 44, "Category": 18, "Supplier price (cost)": 12,
              "Proposed sell price": 12, "Final sell price": 12, "Sizes": 10, "Suggested": 16, "Already on site": 34, "Site price": 10,
              "Matched product ID": 10, "Photo files": 30, "Original message": 70, "Applied": 12}
    for h, w in widths.items(): ws.column_dimensions[get_column_letter(COL[h])].width = w
    dv = DataValidation(type="list", formula1='"ADD,UPDATE PRICE,SKIP"', allow_blank=True)
    ws.add_data_validation(dv); dv.add(f"A2:A{ws.max_row + 500}")
    cats = DataValidation(type="list", formula1='"' + ",".join(CATEGORIES) + '"', allow_blank=True)
    ws.add_data_validation(cats); cats.add(f"G2:G{ws.max_row + 500}")
    ws.freeze_panes = "D2"
    n = wb.create_sheet("How to review")
    for line in ["1. In column A choose ADD, UPDATE PRICE or SKIP for each row (blank rows are ignored).",
                 "2. Check the product name and category (yellow = needs a name). Branded shoes: keep the '-style' wording, no brand claims.",
                 "3. 'Final sell price' is what customers pay. It starts as supplier cost + markup; change it freely.",
                 "4. Save the file, then tell Claude 'apply the approved catalogue rows'.",
                 f"Markup rule: cost +{CFG['markup_percent']}% rounded up to the next KSh {CFG['round_up_to']}; none for your own groups (scripts/intake/config.json)."]:
        n.append([line])
    n.column_dimensions["A"].width = 120
    wb.save(path)


def cmd_scan(args):
    root = work_root(args)
    for d in ("work", "review", "photos"): os.makedirs(os.path.join(root, d), exist_ok=True)
    mpath = os.path.join(root, "processed.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {"zips": {}, "seen": []}
    seen = set(manifest["seen"])
    watch = [cfg_path(p) for p in (args.watch or CFG["watch_dirs"])]
    zips = sorted({z for d in watch for z in glob.glob(os.path.join(d, "WhatsApp Chat*.zip"))})
    if not zips:
        print("No supplier chat exports found in:", *watch, sep="\n  "); return
    live = live_products()
    print(f"live catalogue: {len(live)} products")
    new_sheets = 0
    for z in zips:
        h = hashlib.sha1(open(z, "rb").read()).hexdigest()
        if h in manifest["zips"]:
            continue
        supplier = re.sub(r"\s*\(\d+\)$", "", re.sub(r"^WhatsApp Chat\s*-\s*", "", os.path.basename(z)[:-4])).strip()
        dest = os.path.join(root, "work", f"{slug(supplier)}-{h[:8]}")
        shutil.rmtree(dest, ignore_errors=True); safe_extract(z, dest)
        txts = glob.glob(os.path.join(dest, "*.txt"))
        if not txts:
            print("  no chat text in", os.path.basename(z)); manifest["zips"][h] = {"zip": os.path.basename(z), "note": "no text"}; continue
        msgs = parse_chat(open(txts[0], encoding="utf-8", errors="ignore").read())
        items = build_items(msgs, dest, supplier)
        rows, skipped_seen = [], 0
        for n, it in enumerate(items):
            key = f"{slug(supplier)}|{it['ts'].date()}|{slug(it['name'] or it['photos'][0])}|{it['price']}"
            if key in seen: skipped_seen += 1; continue
            seen.add(key)
            iid = f"{slug(supplier)[:10]}-{h[:4]}-{n:03d}"
            pdir = os.path.join(root, "photos", iid); os.makedirs(pdir, exist_ok=True)
            files = []
            for i, p in enumerate(it["photos"][:CFG["photos_per_product"]], 1):
                try:
                    im = Image.open(os.path.join(dest, p)).convert("RGB"); im.thumbnail((CFG["photo_max_px"],) * 2)
                    fn = f"{iid}-{i}.jpg"; im.save(os.path.join(pdir, fn), "JPEG", quality=80, optimize=True, progressive=True); files.append(fn)
                except Exception:
                    pass
            if not files: continue
            thumb = os.path.join(pdir, "thumb.png"); t = Image.open(os.path.join(pdir, files[0])).convert("RGB"); t.thumbnail((120, 120)); t.save(thumb)
            name = it["name"] or "(name from photo)"
            m = match_live(name, live) if it["name"] else None
            cost = it["price"]; prop = sell_price(cost, supplier)
            if m is None: suggested = "ADD" if cost else "ADD (no price)"
            elif cost and prop and abs(prop - m["price"]) / max(m["price"], 1) > 0.05: suggested = "UPDATE PRICE?"
            else: suggested = "SKIP (on site)"
            rows.append({"decision": "", "id": iid, "supplier": supplier, "posted": it["ts"].strftime("%Y-%m-%d"), "name": name,
                         "category": it["category"], "cost": cost, "proposed": prop, "final": prop, "sizes": it["sizes"], "suggested": suggested,
                         "site_name": m["name"] if m else "", "site_price": m["price"] if m else None, "site_id": m["id"] if m else "",
                         "files": files, "text": it["text"], "thumb": thumb})
        stamp = datetime.date.today().isoformat()
        if rows:
            out = os.path.join(root, "review", f"{stamp}-{slug(supplier)}-{h[:6]}.xlsx"); write_sheet(out, rows); new_sheets += 1
            flagged = [r["id"] for r in rows if r["name"].startswith("(")]
            json.dump({"sheet": out, "photo_dir": os.path.join(root, "photos"), "need_names": flagged}, open(out.replace(".xlsx", ".todo.json"), "w"), indent=1)
            print(f"  {supplier}: {len(msgs)} messages -> {len(rows)} new items ({len(flagged)} photo-only need a name, {skipped_seen} already seen) -> {out}")
        else:
            print(f"  {supplier}: nothing new")
        manifest["zips"][h] = {"zip": os.path.basename(z), "supplier": supplier, "processed": stamp}
    manifest["seen"] = sorted(seen)
    json.dump(manifest, open(mpath, "w"), indent=1)
    print(f"done: {new_sheets} new review sheet(s)")


def cmd_setnames(args):
    names = json.load(open(args.names))
    wb = openpyxl.load_workbook(args.sheet); ws = wb["Review"]; n = 0
    for row in ws.iter_rows(min_row=2):
        iid = row[COL["Item ID"] - 1].value
        if iid in names:
            ws.cell(row=row[0].row, column=COL["Product name"]).value = names[iid]["name"]
            if names[iid].get("category"): ws.cell(row=row[0].row, column=COL["Category"]).value = names[iid]["category"]
            ws.cell(row=row[0].row, column=COL["Product name"]).fill = PatternFill(fill_type=None); n += 1
    wb.save(args.sheet); print(f"named {n} rows")


def cmd_contact(args):
    """Labelled contact sheets of the photo-only posts so each can be named by eye."""
    todo = json.load(open(args.todo)); ids = todo["need_names"]
    outdir = os.path.join(os.path.dirname(os.path.dirname(args.todo)), "contact"); os.makedirs(outdir, exist_ok=True)
    from PIL import ImageDraw, ImageFont
    try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    except Exception: font = ImageFont.load_default()
    per, cell, made = 12, 380, []
    for s0 in range(0, len(ids), per):
        chunk = ids[s0:s0 + per]
        sheet = Image.new("RGB", (4 * cell, ((len(chunk) + 3) // 4) * cell), "white"); d = ImageDraw.Draw(sheet)
        for k, iid in enumerate(chunk):
            fn = sorted(glob.glob(os.path.join(todo["photo_dir"], iid, f"{iid}-1.jpg")))
            if not fn: continue
            im = Image.open(fn[0]).convert("RGB"); im.thumbnail((cell - 8, cell - 8))
            x, y = (k % 4) * cell, (k // 4) * cell; sheet.paste(im, (x + 4, y + 4))
            d.rectangle([x + 4, y + 4, x + 96, y + 46], fill="black"); d.text((x + 10, y + 6), iid[-3:], font=font, fill="yellow")
        path = os.path.join(outdir, f"{os.path.basename(args.todo)[:-10]}-{s0 // per}.jpg"); sheet.save(path, quality=80); made.append(path)
    print("\n".join(made)); print("label = last 3 digits of the Item ID; for the names file use the full Item ID")


# ---------------------------------------------------------------- apply
def cmd_apply(args):
    root = work_root(args)
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key and not args.dry_run:
        sys.exit("SUPABASE_SERVICE_KEY is not set (pass it inline for this run only).")
    env = load_env(); base = env["NEXT_PUBLIC_SUPABASE_URL"]
    H = {"apikey": key or "", "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    sheets = [args.sheet] if args.sheet else sorted(glob.glob(os.path.join(root, "review", "*.xlsx")))
    st, body = http("GET", f"{base}/rest/v1/products?select=slug", H if key else {"apikey": env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]})
    taken = {r["slug"] for r in json.loads(body)}
    st, body = http("GET", f"{base}/rest/v1/categories?select=slug", H if key else {"apikey": env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]})
    cats = {r["slug"] for r in json.loads(body)}
    added = updated = bad = 0
    for sp in sheets:
        wb = openpyxl.load_workbook(sp); ws = wb["Review"]; dirty = False
        for row in ws.iter_rows(min_row=2):
            v = lambda h: row[COL[h] - 1].value
            dec = (v("Decision") or "").strip().upper()
            if dec not in ("ADD", "UPDATE PRICE") or v("Applied"): continue
            name, cat, price = (v("Product name") or "").strip(), (v("Category") or "").strip(), v("Final sell price")
            if not name or name.startswith("("): print(f"  ! {v('Item ID')}: needs a product name"); bad += 1; continue
            if dec == "ADD" and cat == "sneakers-shoes" and BIG_BRANDS.search(name) and "style" not in name.lower():
                print(f"  ! {name}: rename with neutral '-style' wording (e.g. 'Cushion Sneakers (Air Max style)'), no brand claims"); bad += 1; continue
            if not isinstance(price, (int, float)) or price < CFG["min_sell_price"]: print(f"  ! {name}: needs a final sell price"); bad += 1; continue
            ok = False
            if dec == "UPDATE PRICE":
                pid = v("Matched product ID")
                if not pid: print(f"  ! {name}: UPDATE PRICE but no matched product"); bad += 1; continue
                print(f"  {'(dry) ' if args.dry_run else ''}price {name} -> KSh {int(price)}")
                if not args.dry_run:
                    s, r = http("PATCH", f"{base}/rest/v1/products?id=eq.{pid}", H, json.dumps({"price": int(price), "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())}).encode())
                    ok = s in (200, 204)
                    if not ok: print("    failed:", s, r[:150])
                else: ok = True
                updated += ok
            else:
                if cat not in cats: print(f"  ! {name}: category '{cat}' doesn't exist yet (create it first)"); bad += 1; continue
                base_slug = s_ = slug(name); n = 2
                while s_ in taken: s_ = f"{base_slug}-{n}"; n += 1
                taken.add(s_)
                files = [f for f in (v("Photo files") or "").split(", ") if f]
                pdir = os.path.join(root, "photos", v("Item ID"))
                sizes = v("Sizes")
                desc = DESC.get(cat, "") + (f" Sizes {sizes}. Please add your size in the Order Notes at checkout." if sizes and cat == "sneakers-shoes" else "")
                print(f"  {'(dry) ' if args.dry_run else ''}add   {name} | {cat} | KSh {int(price)} | {len(files)} photo(s)")
                if args.dry_run: ok = True; added += 1
                else:
                    pid = str(uuid.uuid4()); urls = []
                    try:
                        for fn in files:
                            hd = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "image/jpeg", "x-upsert": "true"}
                            s, r = http("POST", f"{base}/storage/v1/object/product-images/{pid}/{fn}", hd, open(os.path.join(pdir, fn), "rb").read())
                            if s not in (200, 201): raise RuntimeError(f"photo {fn}: {s}")
                            urls.append(f"{base}/storage/v1/object/public/product-images/{pid}/{fn}")
                        rowj = {"id": pid, "slug": s_, "name": name, "category": cat, "subcategory": None, "price": int(price), "discount_price": None,
                                "images": urls, "colors": None, "features": [], "rating": 0, "review_count": 0, "stock": 0, "is_deal": False,
                                "deal_ends_at": None, "deal_claimed_percent": None, "is_new_arrival": True, "verified": False, "description": desc, "jumia_url": None}
                        s, r = http("POST", f"{base}/rest/v1/products", H, json.dumps(rowj).encode())
                        if s not in (200, 201): raise RuntimeError(f"insert: {s} {r[:150]}")
                        ok = True; added += 1
                    except Exception as e:
                        print("    failed:", e)
            if ok and not args.dry_run:
                ws.cell(row=row[0].row, column=COL["Applied"]).value = datetime.date.today().isoformat(); dirty = True
        if dirty: wb.save(sp)
    print(f"{'(dry run) ' if args.dry_run else ''}added {added}, price updates {updated}, rows needing attention {bad}")
    if (added or updated) and not args.dry_run:
        print("Catalogue changed in the database. It shows on the site after the next rebuild (Publish changes in admin).")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan"); s.add_argument("--watch", action="append"); s.add_argument("--work")
    n = sub.add_parser("setnames"); n.add_argument("sheet"); n.add_argument("names")
    c = sub.add_parser("contact"); c.add_argument("todo")
    a = sub.add_parser("apply"); a.add_argument("--sheet"); a.add_argument("--work"); a.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    {"scan": cmd_scan, "setnames": cmd_setnames, "contact": cmd_contact, "apply": cmd_apply}[args.cmd](args)


if __name__ == "__main__":
    main()
