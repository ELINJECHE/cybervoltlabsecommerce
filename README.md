# Cybervolt Labs

Mobile-first e-commerce storefront for Cybervolt Labs — a Kenyan general-merchandise retailer
(mobile phones, laptops, fashion accessories, furniture, interior décor, electronics, motorcycle
gear, cyber cafe supplies, and services), based in Ongata Rongai. Built with Next.js 14 (App
Router), TypeScript and Tailwind CSS, exported as static HTML for cheap hosting on Vercel or
Netlify.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**, themed entirely through CSS variables (`app/globals.css`)
- **Static export** (`output: "export"` in `next.config.mjs`) — `npm run build` produces a
  plain `out/` folder of HTML/CSS/JS. The catalog and accounts layer can be backed by Supabase,
  but the *site itself* stays static — see "Product catalog & admin panel" below.
- **Supabase** (optional but recommended) — customer accounts, loyalty points, and the live
  product catalog behind `/admin`. Everything gracefully falls back to `data/*.json` and a
  "coming soon" state if it isn't configured. See `docs/SUPABASE_SETUP.md`.
- Cart state in React Context + `localStorage` (`lib/cart-context.tsx`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your WhatsApp number, Till number, etc.
npm run dev                  # http://localhost:3000
```

### Or with Docker

```bash
docker compose up --build      # http://localhost:3000, live-reloads from your source
docker compose run --rm web npm run build   # one-off production build check
```

Build the static export:

```bash
npm run build   # outputs to /out
```

Deploy `/out` to Vercel, Netlify, or any static host. (Vercel can also just build the repo
directly — no need to hand-upload `/out`.)

## Folder structure

```
app/               Routes (App Router) — pages only, no business logic
  admin/           Product/category management, gated to accounts with is_admin = true
  account/         Signup, login, points/order-history dashboard
components/        Reusable, typed UI components
  admin/           Admin-only form components
lib/                Data access, cart/auth context, formatting, WhatsApp/Jumia link builders
data/               products.json, categories.json — fallback catalog when Supabase isn't set up
public/assets/images/  Product/category/hero images
scripts/            generate-placeholder-images.mjs, seed-supabase.mjs
docs/               Setup guides for Supabase and the Google Sheets order webhook
```

## Product catalog & admin panel

Two ways to manage products, from simplest to most capable:

1. **Edit `data/products.json` / `data/categories.json` directly** and redeploy. No Supabase
   needed — this is the fallback source whenever Supabase isn't configured. Schema (see
   `lib/types.ts`):

   ```ts
   {
     id, slug, name, category, subcategory,
     price, discountPrice, images: string[], colors: {name, hex}[],
     features: string[], rating, reviewCount, stock,
     isDeal, dealEndsAt, dealClaimedPercent, isNewArrival, verified,
     description, jumiaUrl
   }
   ```

2. **Use the `/admin` panel** (once Supabase is set up per `docs/SUPABASE_SETUP.md`) — create,
   edit, and delete products/categories with image upload, gated to accounts with
   `is_admin = true`. Since the site is a static export, saving a product triggers a **deploy
   hook** (`NEXT_PUBLIC_DEPLOY_HOOK_URL`) that rebuilds the site automatically — changes go live
   in about 1–2 minutes, not instantly. Run `scripts/seed-supabase.mjs` once to copy the existing
   `data/*.json` catalog into Supabase so `/admin` has something to start from.

Either way, every page reads data through `lib/products.ts` (`getAllProducts`,
`getProductBySlug`, etc.) — never import the JSON files or query Supabase directly elsewhere.

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_WHATSAPP_NUMBER` — international format, no `+`, used for the floating WhatsApp
  button and "Buy on WhatsApp" links.
- `NEXT_PUBLIC_ORDER_WEBHOOK_URL` — checkout POSTs the order here as JSON (see
  `docs/GOOGLE_SHEETS_WEBHOOK.md` for a no-backend Google Sheets option). Leave unset in
  development to see the fallback error on checkout.
- `NEXT_PUBLIC_MPESA_TILL` — Till Number (Buy Goods and Services) shown on the checkout page.
- `NEXT_PUBLIC_GA4_ID` — GA4 Measurement ID. Leave unset to disable analytics (this is the only
  analytics script wired up, per the performance budget — never add Meta Pixel alongside it).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — see `docs/SUPABASE_SETUP.md`.
- `NEXT_PUBLIC_DEPLOY_HOOK_URL` — see "Product catalog & admin panel" above.

## Loyalty points

5 points (worth KES 50) per KES 1,000 spent on a confirmed order, plus a one-time 100-point
newsletter signup bonus — both require a customer account (Supabase), since points tied to an
anonymous browser session can't mean anything. There's no payment gateway, so an order is
credited only after staff manually confirm the M-Pesa payment and flip its status in Supabase —
see `docs/SUPABASE_SETUP.md` step 5.

## Third-party integrations not yet wired up

Per project instructions, ask before adding:

- Payment gateway (checkout currently just captures the order and shows M-Pesa Till instructions
  manually)
- Live chat widget beyond the WhatsApp deep link (intentionally skipped — the floating WhatsApp
  button already covers this, per a deliberate choice to keep JS minimal)

## Performance notes

- Images are lazy-loaded by default via `next/image` (`loading="lazy"`); only the hero
  carousel and the active product-gallery image use `priority`.
- Only one Google Font family, two weights (Plus Jakarta Sans, 400/700).
- No client-side data fetching on first paint for the public site — all product/category data is
  resolved at build time (from Supabase or `data/*.json`) and rendered statically. Only
  `/account` and `/admin` fetch client-side, since they're inherently per-user/dynamic.
