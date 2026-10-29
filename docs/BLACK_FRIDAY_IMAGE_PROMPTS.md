# Black Friday images: detailed prompts (v2)

## The method that gives Jumia-level polish
Jumia's banners look rich because they stack many details: a brand mark and date, a huge headline, an offer pill, value-prop
icons, a button, and a vivid character with products. Image AIs are good at the **artwork** (character, products, lighting) but
bad at **small text and icons** (they misspell and warp them). So we split the job:

| Layer | Who makes it | Where it lives |
|---|---|---|
| **Artwork only** (mascot, products, glow, confetti, price tags) | You, in an image app, using the prompts below | `public/assets/images/bf/hero-N.webp` and `hero-N-m.webp` |
| **Text, date, offer pill, value-prop icons, button** | The website, drawn live over the art | `lib/blackfriday.ts` (words) and `components/BlackFridayHero.tsx` (layout) |

Result: crisp, correct text and icons, an offer pill that always shows a real discount, and you can change any wording without
re-generating an image. **Do not ask the image app to write any words on the hero art.**

What the site draws on top of every hero (so leave the space for it):
`[logo] • 30 OCT - 30 NOV` / `BLACK FRIDAY` (gold) / the two-line headline / a white pill (`Up to X% off` or `Real price cuts`) / three icon
chips (truck "Free delivery over KSh 5,000", phone "Pay with M-Pesa", return arrow "48-hour returns", bolt "Same-day in Nairobi") / mint button with an arrow.

## Sizes and file names
- Desktop: **2400 x 1000** px, save as `hero-1.webp` (then `hero-2`, `hero-3`).
- Phone: **1200 x 900** px (4:3), save as `hero-1-m.webp` (then `hero-2-m`, `hero-3-m`).
- Export WebP, quality about 85, under 250 KB each. Tell me the extension and I'll switch it (`BF_ART_EXT` in `lib/blackfriday.ts`).

## Layout rules for EVERY hero image
- **Desktop:** keep the **left 55%** as a calm, dark area (near-black with a soft glow; no objects, no busy detail). All the action goes in the **right 45%**.
- **Phone:** keep the **top 60%** calm and dark; put the character and products in the **bottom 40%**, centred or bottom-right.
- The subject (mascot + products) is cut off by nothing; leave 5% margin; the bottom edge can fade into a glowing floor.
- **Brand palette:** near-black #07070D to deep indigo #14142A background; indigo #4D66B0, magenta #E174F8, mint #5DE7A4, gold #FFC83D accents.

## Master prompt (paste first, then add the scene line)
> Ultra-detailed e-commerce hero banner artwork, wide 12:5 format, **no text, no letters, no numbers, no logos, no watermarks**. Cinematic
> dark studio background in near-black to deep indigo with soft volumetric spotlight, magenta and indigo rim-light glows, subtle diagonal light rays
> and fine sparkle particles. The entire left half is empty dark negative space with a gentle gradient. On the right: a charismatic, original
> cartoon-caricature mascot (a friendly young Kenyan shopper-rider with a big confident smile, stylised oversized head, trendy round sunglasses with
> a lightning-bolt shape on the lens, a mint-green delivery jacket, a gold lightning-bolt chest badge) bursting out of an open brown cardboard delivery
> box, holding products up with both hands. Glossy 3D price-tag shapes, floating shopping bags and confetti around him, small neon lightning bolts,
> a glowing reflective floor under the box. Premium, energetic, high contrast, sharp focus, depth of field, 8k render, Pixar-like lighting.

### Scene lines (add one to the master prompt)
**hero-1, Black Friday kick-off:** *The box overflows with a mix of household and lifestyle products: a motorcycle helmet, a pair of sneakers, a small
air fryer, a Bluetooth speaker and folded bedding. The mascot holds a sneaker in one hand and a helmet in the other.*

**hero-2, Ride Ready (motorcycle gear):** *The mascot wears a half-zipped riding jacket and holds a full-face helmet in one hand and a pair of riding gloves
in the other. Around the box: knee guards, a hi-vis vest, a top-box case and a small motorcycle silhouette made of light. Generic gear with no brand marks.*

**hero-3, Cosy Up (home and bedding):** *The mascot hugs a stack of neatly folded duvets and pillows. Around him: a patterned duvet set, curtains, a kitchen
blender, a flask and a cosy lamp. Warm mint and indigo glow, soft and inviting.*

### Phone version (same scene, different framing)
Add: *Square-ish 4:3 composition. The top 60% is empty dark negative space with a soft gradient. The mascot and box sit in the bottom 40%, centred, big and
close-up, with products spilling toward the camera.*

### Negative prompt (if the app has one)
text, letters, words, numbers, logo, watermark, brand names, Jumia, Nike, Adidas, Alpinestars, Samsung, extra fingers, deformed hands, blurry, low resolution,
cluttered background, busy left side, cropped head

## Your own mascot (make it once, reuse everywhere)
Do **not** copy Jumia's "Plug Wako" (a trademarked character). Make an original one, save the best result, and reuse it as a reference image so he looks the
same in every banner. Suggested name: **"Volt"** (fits Cybervolt).
> Character design sheet of an original cartoon-caricature mascot named Volt: a friendly young Kenyan man, big smile, stylised oversized head, round sunglasses
> with a lightning-bolt on the lens, mint-green delivery jacket with a gold lightning badge, indigo sneakers. Front view, three-quarter view and a thumbs-up pose,
> clean flat background, consistent proportions, polished 3D cartoon style.
Tip: in Midjourney use `--cref <image link>`; in Ideogram or ChatGPT upload the sheet as a reference ("same character as the reference image").

## Promo tiles (1200 x 600): these two are FULLY BAKED (text inside the image)
Because they are small, I leave their text in the image. Ask the app for these exact words and double-check the spelling.

**`tile-calendar`:** *Dark banner, left side text, right side a glowing 3D calendar page with a lightning bolt and Volt the mascot leaning on it. Text, in a bold
modern sans-serif: "BLACK FRIDAY" (gold, small) / "Day by Day" (white, large) / "Know what's dropping before everyone else." (white, small) / a mint button "View the
calendar →". Indigo and magenta glow, subtle sparkles, premium look.*

**`tile-whatsapp`:** *Dark banner, left side text, right side Volt the mascot holding a phone with a glowing green chat bubble and a bell, price tags floating around.
Text: "BE FIRST" (gold, small) / "Get the drops on WhatsApp" (white, large) / "Free group. Deals before the site." (white, small) / a mint button "Join free →".
Mint and indigo glow.*

## Rules (keep the site honest)
- No other brands' logos or characters, and never the words genuine / original / authentic.
- Do not put a percentage on any image. The pill on the hero shows the biggest real discount automatically.
- Only icons and claims that are true: free delivery over KSh 5,000 (Nairobi), M-Pesa, 48-hour returns, same-day Nairobi delivery.
