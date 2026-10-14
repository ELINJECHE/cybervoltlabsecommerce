# On-page SEO

All page titles, descriptions, canonical links, social-share tags and structured data come from
`lib/seo.ts` — pages don't hand-write them. To check a build, run `npm run build` and look at the
HTML in `out/`.

## What every indexable page gets
- **Title** ending in "| Cybervolt Labs", kept to about 60 characters. Products use
  "Name – KSh price"; if that's too long, the name alone; if still too long, the name without its
  bracketed part. Categories use "Category in Kenya".
- **Meta description**, unique per page, 120–158 characters, ending on a whole sentence.
- **Canonical link** to the page's own address on `https://cybervoltlabs.co.ke`.
- **Open Graph and Twitter tags** (link previews on WhatsApp, Facebook, X). Products use their own
  first photo; everything else uses the default card in `app/opengraph-image.png`.
- **Structured data (JSON-LD)**
  - Home: `OnlineStore` (name, logo, Ongata Rongai, WhatsApp contact, social profiles) + `WebSite`.
  - Category: `CollectionPage` with an `ItemList` of products + `BreadcrumbList`.
  - Product: `Product` with an `Offer` in KES, a 2-day return policy matching the Return Policy page,
    + `BreadcrumbList`. Left out when a product has no photo (it would be invalid). Star ratings are
    only included when a product has real reviews.
- One `<h1>` per page (the home page has a screen-reader-only one).

## Pages kept out of search results
Cart, checkout, account pages and search carry `noindex`; `/admin`, `/account`, `/cart` and
`/checkout` also send an `X-Robots-Tag` header from `netlify.toml`. `robots.txt` blocks the same
areas and points at `sitemap.xml`, which lists every indexable page.

## Writing copy that helps SEO
- Give every product a **description** in the admin panel. Most products have none; the first
  sentence becomes the search-result snippet, so make it specific ("Black leather lace-up shoes
  with a white sole").
- Don't state things you can't prove (genuine/original/authentic, "was" prices that never applied).
  The site's wording was cleaned up on this basis.

## After each deploy
1. Google Search Console: add `https://cybervoltlabs.co.ke` (domain property), submit
   `https://cybervoltlabs.co.ke/sitemap.xml`.
2. Check a product URL in Google's Rich Results Test to confirm the Product markup reads cleanly.
3. If you move off Netlify, recreate the `X-Robots-Tag` rules (`netlify.toml`) on the new host.
