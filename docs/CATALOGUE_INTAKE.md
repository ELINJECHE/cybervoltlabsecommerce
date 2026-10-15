# Supplier chat -> catalogue (semi-automatic)

WhatsApp can't be read automatically, so one tap a day starts the loop. Nothing reaches the live
shop until you approve it.

## Daily routine
1. **Export** the supplier group in WhatsApp: group name -> *Export chat* -> *Include media* ->
   save to Google Drive, folder **Cybervolt Supplier Chats** (My Drive).
   The file must be named `WhatsApp Chat - <group>.zip` (WhatsApp does this by default).
2. **08:00 every day** a Claude scheduled task (needs the Claude app open) runs
   `python3 scripts/intake/catalogue_intake.py scan`: it finds new exports, parses the posts,
   matches them against the live catalogue, names photo-only posts by looking at them, and writes
   a review sheet to `intake/review/<date>-<group>-<id>.xlsx` (pictures included).
   Run it yourself any time with the same command.
3. **Review** the sheet: column A = `ADD` or `SKIP` (blank = ignored). Check names, categories and
   the *Final sell price* (supplier price + 20% margin, editable). Products already on the site are
   marked `SKIP (on site)`: **prices of existing products are never changed from here, admin sets them.**
4. **Tell Claude "apply the approved catalogue rows"**. It runs
   `SUPABASE_SERVICE_KEY=... python3 scripts/intake/catalogue_intake.py apply` (add `--dry-run` to
   preview). The service key is passed for that one run only and is never stored.
5. **Publish changes** in the admin panel (one Netlify build for the whole day's changes).

## Rules built in
- Exports are cumulative, so posts already seen are skipped (`intake/processed.json`).
- Main suppliers: Brown Collection, Jamnet Wholesalers, Phyllis Households, Open Air, Splendid Homes
  (matched from the export's file name). Their posted price is treated as your cost and the listed
  price is cost +20%, rounded up to the next KSh 10. Groups in `retail_price_sources` (your own
  broadcast group) get no margin. A group not on the list is flagged and also gets 20%.
  Edit `scripts/intake/config.json`.
- Every product added records its supplier, supplier cost and listed price in the admin-only table
  `product_sourcing`. **One-time setup:** run `docs/sql/product_sourcing.sql` in Supabase (SQL Editor).
  Then, once: `SUPABASE_SERVICE_KEY=... python3 scripts/intake/catalogue_intake.py backfill --own-slugs intake/own-group-slugs.json`
  gives older products a record too (supplier "Earlier import" / "Cybervolt WhatsApp offers group",
  cost unknown).
- **Admin -> Inventory & pricing** shows, per supplier, how many products, total supplier cost, total
  listed value, average margin, price changes since listing and products below cost or under a 10%
  margin, plus a sortable product table and CSV download, to guide pricing adjustments.
- Branded shoes must be renamed with neutral "-style" wording; `apply` refuses brand names.
- Category must already exist; new categories are created by hand first.
- Chats and photos live in `intake/` (git-ignored): never committed, never public.

## Files
`scripts/intake/catalogue_intake.py` (commands: `scan`, `contact`, `setnames`, `apply`),
`scripts/intake/config.json`.
