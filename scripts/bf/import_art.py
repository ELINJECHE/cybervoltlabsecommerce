"""Import the generated Black Friday artwork from ~/Downloads into public/assets/images/bf as WebP.
Desktop heroes are used as they are; phone versions are cut from the right-hand subject and
extended upwards with a soft dark glow (the site draws its text over that empty space).
Run: python3 scripts/bf/import_art.py"""
import os
import numpy as np
from PIL import Image, ImageFilter

DL = os.path.expanduser("~/Downloads")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "images", "bf")
SRC = {
    "hero-1": "WhatsApp Image 2026-10-29 at 19.52.04.jpeg",
    "hero-2": "WhatsApp Image 2026-10-29 at 19.53.46.jpeg",
    "hero-3": "WhatsApp Image 2026-10-29 at 20.01.53.jpeg",
    "tile-calendar": "WhatsApp Image 2026-10-29 at 20.11.18.jpeg",
    "tile-whatsapp": "WhatsApp Image 2026-10-29 at 20.14.01.jpeg",
}

def remove_box_logo(im):
    """hero-3 came with a stray orange logo on the cardboard box: fill it from the box colours around it."""
    a = np.asarray(im).astype(float)
    cy, cx, r = 502, 1092, 84
    for y in range(cy - r, cy + r + 1):
        dx = int((r * r - (y - cy) ** 2) ** 0.5)
        l = a[y, cx - dx - 22:cx - dx - 6].mean(axis=0)
        rr = a[y, cx + dx + 6:cx + dx + 22].mean(axis=0)
        for x in range(cx - dx, cx + dx + 1):
            t = (x - (cx - dx)) / max(1, 2 * dx)
            a[y, x] = l * (1 - t) + rr * t + np.random.normal(0, 2.2, 3)
    return Image.fromarray(a.clip(0, 255).astype("uint8"))

def phone(im, w=1200, h=1700, x0=640):
    crop = im.crop((x0, 0, im.width, im.height))
    s = w / crop.width
    crop = crop.resize((w, round(crop.height * s)), Image.LANCZOS)
    arr = np.asarray(crop).astype(float)
    top = arr[:24].mean(axis=0)                           # colour of the top edge, per column
    top = np.asarray(Image.fromarray(top[None].repeat(8, 0).astype("uint8")).filter(ImageFilter.GaussianBlur(40)))[4]
    ext_h = h - crop.height
    ext = np.zeros((ext_h, w, 3))
    for i in range(ext_h):
        k = (i / ext_h) ** 1.6                           # 0 at the very top (darkest) to 1 at the join
        ext[i] = np.array([7, 7, 13]) * (1 - k) + top * 0.9 * k
    canvas = np.vstack([ext, arr]).astype("uint8")
    out = Image.fromarray(canvas)
    # soften the seam
    seam = out.crop((0, ext_h - 40, w, ext_h + 40)).filter(ImageFilter.GaussianBlur(6))
    out.paste(seam, (0, ext_h - 40))
    return out

def save(im, name):
    p = os.path.join(OUT, name + ".webp")
    im.save(p, "WEBP", quality=84, method=6)
    print(name, im.size, os.path.getsize(p) // 1024, "KB")

for name, f in SRC.items():
    im = Image.open(os.path.join(DL, f)).convert("RGB")
    if name == "hero-3":
        im = remove_box_logo(im)
    if name.startswith("hero"):
        im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
        save(im, name)
        save(phone(im, x0=960), name + "-m")
    else:
        save(im, name)
