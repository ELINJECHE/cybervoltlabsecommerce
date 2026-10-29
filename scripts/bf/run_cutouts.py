#!/usr/bin/env python3
"""Run the Apple Vision cut-out over every live product's main photo (local only, nothing is uploaded).
Writes intake/cutouts/<slug>.jpg (1000x1000, plain light background) and intake/cutouts/results.json.
Usage: python3 scripts/bf/run_cutouts.py <cutout-binary>   (build it: swiftc -O scripts/bf/cutout.swift -o cutout)"""
import os, sys, json, subprocess, urllib.request, concurrent.futures as cf, re, time
BIN = os.path.abspath(sys.argv[1]); ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(ROOT, "intake", "cutouts"); os.makedirs(OUT, exist_ok=True)
env = {}
for l in open(os.path.join(ROOT, ".env.local")):
    if "=" in l and not l.startswith("#"): a, b = l.strip().split("=", 1); env[a] = b
u, k = env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
prods, off = [], 0
while True:
    r = urllib.request.Request(f"{u}/rest/v1/products?select=slug,name,category,images&order=created_at", headers={"apikey": k, "Authorization": "Bearer " + k, "Range": f"{off}-{off+999}"})
    d = json.load(urllib.request.urlopen(r)); prods += d
    if len(d) < 1000: break
    off += 1000
done = json.load(open(os.path.join(OUT, "results.json"))) if os.path.exists(os.path.join(OUT, "results.json")) else {}
SITE = "https://cybervoltlabs.co.ke"
def work(p):
    s = p["slug"]
    if s in done: return s, done[s]
    url = p["images"][0] if p["images"] else ""
    if not url or url.lower().endswith(".svg"): return s, {"status": "skip", "why": "no raster photo"}
    url = url if url.startswith("http") else SITE + url
    src = os.path.join(OUT, f"_{s}.src")
    for t in range(5):
        try: open(src, "wb").write(urllib.request.urlopen(url, timeout=40).read()); break
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(2 * (t + 1)); continue
            return s, {"status": "skip", "why": f"download {e.code}"}
        except Exception: time.sleep(1)
    else: return s, {"status": "skip", "why": "download failed"}
    r = subprocess.run([BIN, src, os.path.join(OUT, f"{s}.jpg"), "1000"], capture_output=True, text=True)
    os.remove(src)
    m = re.match(r"OK frac=([\d.]+) box=([\d.]+) edges=(\d) w=(\d+) h=(\d+)", r.stdout.strip())
    if not m: return s, {"status": "fail", "why": (r.stdout or r.stderr).strip()[:40]}
    frac, box, edges, w, h = float(m[1]), float(m[2]), int(m[3]), int(m[4]), int(m[5])
    return s, {"status": "ok", "frac": frac, "box": box, "edges": edges, "w": w, "h": h}
with cf.ThreadPoolExecutor(4) as ex:
    for i, (s, res) in enumerate(ex.map(work, prods)):
        done[s] = res
        if i % 50 == 0: print(i, "of", len(prods), flush=True); json.dump(done, open(os.path.join(OUT, "results.json"), "w"))
json.dump(done, open(os.path.join(OUT, "results.json"), "w"))
import collections; print(collections.Counter(v["status"] for v in done.values()))
