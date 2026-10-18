# Storefront features: where to change things

| What | Where |
|---|---|
| Group links, MVP code, KSh 100 discount, 5-per-order limit, phone bottom bar on/off | `lib/community.ts` |
| Last-order hour (5pm) and public holidays | `lib/delivery-clock.ts` (`LAST_ORDER_HOUR`, `EXTRA_HOLIDAYS` for Eid and one-off days, as "YYYY-MM-DD") |
| Delivery fees by area | `lib/delivery.ts` |
| Order of the homepage shelves | `SHELVES` in `app/page.tsx` |
| Which categories lead the menu | `CATEGORY_PRIORITY` in `lib/products.ts` |
| Budget pages (Under KSh 500 ...) | `lib/price-steps.ts` |
| "Shop by need" collections | `lib/collections.ts` |
| "Complete your set" pairings | `lib/pairings.ts` |
| Search synonyms | `lib/search.ts` (`SYNONYMS`) |

## Things to know
- The MVP code sits in the page code, so anyone can read it. Rotate it monthly and tell the MVP group.
- The same-day countdown uses Nairobi time. Update `EXTRA_HOLIDAYS` every year for movable holidays.
- Products with no price stay off the shop (and out of search) until priced in admin.
- "Recommended for you", saved items and price-drop notices are computed in the visitor's browser from
  their own history. Nothing is stored on a server. The price-alert button opens a WhatsApp message and
  is answered by hand; it is not automatic.
- Search uses `/search-index.json`, rebuilt with every build.
