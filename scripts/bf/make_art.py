#!/usr/bin/env python3
"""Black Friday banner placeholders (SVG) for the storefront, in Cybervolt's colours.
Run: python3 scripts/bf/make_art.py   -> public/assets/images/bf/*.svg
They are stand-ins: swap each for a better image of the SAME file name stem and size
(see docs/BLACK_FRIDAY_IMAGE_PROMPTS.md) and update the extension in lib/blackfriday.ts."""
import os
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "images", "bf")
os.makedirs(OUT, exist_ok=True)
FONT = "'Arial Black','Helvetica Neue',Arial,sans-serif"
INDIGO, MAGENTA, MINT, GOLD = "#4d66b0", "#e174f8", "#5de7a4", "#ffc83d"

def defs(w, h, c1, c2):
    return f'''<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07070d"/><stop offset="1" stop-color="#14142a"/></linearGradient>
<radialGradient id="g1" cx="0.8" cy="0.3" r="0.6"><stop offset="0" stop-color="{c1}" stop-opacity="0.55"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx="0.15" cy="0.95" r="0.6"><stop offset="0" stop-color="{c2}" stop-opacity="0.4"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></radialGradient>
<linearGradient id="txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="{GOLD}"/></linearGradient>
</defs><rect width="{w}" height="{h}" fill="url(#bg)"/><rect width="{w}" height="{h}" fill="url(#g1)"/><rect width="{w}" height="{h}" fill="url(#g2)"/>'''

def bolt(x, y, s, fill):
    return f'<g transform="translate({x},{y}) scale({s})"><path d="M60 0 L0 110 H46 L30 200 L110 80 H62 L80 0 Z" fill="{fill}"/></g>'

def tag(x, y, s, fill, text):
    return (f'<g transform="translate({x},{y}) rotate(-12) scale({s})"><path d="M0 40 L40 0 H190 Q210 0 210 20 V100 Q210 120 190 120 H40 Z" fill="{fill}"/>'
            f'<circle cx="38" cy="60" r="9" fill="#07070d"/><text x="125" y="82" text-anchor="middle" font-family="{FONT}" font-size="44" fill="#07070d" font-weight="900">{text}</text></g>')

def sparkles(w, h):
    pts = [(0.52, 0.15), (0.9, 0.12), (0.66, 0.82), (0.95, 0.7), (0.45, 0.6)]
    return "".join(f'<path d="M{w*x:.0f} {h*y-14:.0f} L{w*x+4:.0f} {h*y-4:.0f} L{w*x+14:.0f} {h*y:.0f} L{w*x+4:.0f} {h*y+4:.0f} L{w*x:.0f} {h*y+14:.0f} L{w*x-4:.0f} {h*y+4:.0f} L{w*x-14:.0f} {h*y:.0f} L{w*x-4:.0f} {h*y-4:.0f} Z" fill="#fff" opacity="0.7"/>' for x, y in pts)

def lines(items, x, y, step, size, anchor="start"):
    out = []
    for i, (t, fill, sz) in enumerate(items):
        yy = y + sum(items[j][2] * 1.12 for j in range(i))
        out.append(f'<text x="{x}" y="{yy:.0f}" font-family="{FONT}" font-size="{sz}" font-weight="900" fill="{fill}" text-anchor="{anchor}">{t}</text>')
    return "".join(out)

def cta(x, y, w, h, text, size):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{MINT}"/><text x="{x+w/2}" y="{y+h*0.66:.0f}" text-anchor="middle" font-family="{FONT}" font-size="{size}" font-weight="900" fill="#07070d">{text}</text>'

def esc(t):
    return t.replace("&", "&amp;")

def fit(lines_, max_w, max_h, ratio=0.72):
    """Largest font size where the longest line fits max_w and all lines fit max_h."""
    longest = max(len(t) for t in lines_)
    return min(max_w / (longest * ratio), max_h / (len(lines_) * 1.08))

def banner(name, w, h, kicker, head, sub, ctatext, c1, c2, motif, mobile=False, art_only=False):
    left = w * 0.07
    text_w = w * (0.86 if mobile else 0.52)
    body = defs(w, h, c1, c2) + sparkles(w, h)
    # artwork: kept clear of the text block (right side on desktop, lower right on mobile)
    if mobile:
        ax, ay, au = w * 0.56, h * 0.50, h * 0.42
    else:
        ax, ay, au = w * 0.62, h * 0.08, h * 0.9
    if motif == "bolt":
        body += bolt(ax + au * 0.35, ay, au / 220 * 0.9, MAGENTA) + bolt(ax + au * 0.85, ay + au * 0.25, au / 220 * 0.55, GOLD) + tag(ax + au * 0.1, ay + au * 0.62, au / 520, MINT, "-%")
    elif motif == "tags":
        body += tag(ax + au * 0.15, ay + au * 0.1, au / 330, MINT, "SALE") + tag(ax + au * 0.55, ay + au * 0.62, au / 440, GOLD, "NEW")
    else:
        cx, cy, r = ax + au * 0.5, ay + au * 0.5, au * 0.34
        body += f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="none" stroke="{MINT}" stroke-width="{au*0.035:.0f}" opacity="0.85"/><circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r*0.6:.0f}" fill="{MAGENTA}" opacity="0.9"/>' + bolt(cx - r * 0.3, cy - r * 0.45, r / 150, "#fff")
    if art_only:
        body += f'<text x="{w-20}" y="{h-14}" text-anchor="end" font-family="{FONT}" font-size="{h*0.024:.0f}" fill="#fff" opacity="0.3">Placeholder artwork - replace with your own</text>'
        open(os.path.join(OUT, name + ".svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>')
        return
    ks = h * (0.05 if mobile else 0.052)
    y = h * (0.12 if mobile else 0.17)
    body += f'<text x="{left:.0f}" y="{y+ks:.0f}" font-family="{FONT}" font-size="{ks:.0f}" font-weight="900" fill="{GOLD}" letter-spacing="{ks*0.16:.0f}">{esc(kicker)}</text>'
    y += ks * 1.9
    hs = fit(head, text_w, h * (0.34 if mobile else 0.40))
    for i, t in enumerate(head):
        body += f'<text x="{left:.0f}" y="{y+hs*(i+0.85):.0f}" font-family="{FONT}" font-size="{hs:.0f}" font-weight="900" fill="url(#txt)">{esc(t)}</text>'
    y += hs * len(head) * 1.08 + h * 0.03
    ss = min(h * (0.045 if mobile else 0.05), text_w / (len(sub) * 0.55))
    body += f'<text x="{left:.0f}" y="{y+ss:.0f}" font-family="{FONT}" font-size="{ss:.0f}" font-weight="700" fill="#ffffff" opacity="0.92">{esc(sub)}</text>'
    bh = h * (0.1 if mobile else 0.115); bw = min(text_w * (0.5 if mobile else 1), bh * (len(ctatext) * 0.5 + 2.2))
    body += cta(left, (h * 0.72 if mobile else h * 0.9 - bh), bw, bh, esc(ctatext), bh * 0.4)
    body += f'<text x="{w-20}" y="{h-14}" text-anchor="end" font-family="{FONT}" font-size="{h*0.024:.0f}" fill="#fff" opacity="0.3">Placeholder art - replace with your own</text>'
    open(os.path.join(OUT, name + ".svg"), "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>')

SLIDES = [
    ("hero-1", "BLACK FRIDAY", ["BIGGEST OFFERS", "READY TO DROP"], "30 Oct - 30 Nov. Real price drops, no inflated prices.", "Shop Black Friday", INDIGO, MAGENTA, "bolt"),
    ("hero-2", "BLACK FRIDAY | RIDE READY", ["HELMETS, JACKETS", "& GLOVES"], "Motorcycle gear picks with same-day Nairobi delivery", "Shop Motorcycle Gear", MAGENTA, INDIGO, "tags"),
    ("hero-3", "BLACK FRIDAY | HOME", ["COSY UP", "THIS SEASON"], "Bedding, curtains and kitchen finds, delivered fast", "Shop Home & Bedding", INDIGO, MINT, "ring"),
]
for name, kick, head, sub, ct, c1, c2, mo in SLIDES:
    banner(name, 2400, 1000, kick, head, sub, ct, c1, c2, mo, art_only=True)
    banner(name + "-m", 1200, 900, kick, head, sub, ct, c1, c2, mo, mobile=True, art_only=True)

def tile(name, kick, head, sub, ctatext, c1, c2, mo):
    banner(name, 1200, 600, kick, head, sub, ctatext, c1, c2, mo, mobile=True)
tile("tile-calendar", "BLACK FRIDAY", ["DAY BY DAY"], "See what drops each week", "View the calendar", MAGENTA, INDIGO, "tags")
tile("tile-whatsapp", "BE FIRST", ["GET THE DROPS", "ON WHATSAPP"], "Free group. Deals before the site.", "Join free", INDIGO, MINT, "ring")
print("wrote", sorted(os.listdir(OUT)))
