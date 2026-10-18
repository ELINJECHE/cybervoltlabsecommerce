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

## Supplier price changes
When a supplier reposts something you already sell, the scan compares the new supplier price with
your current selling price and colours the row:
- **⚠ BELOW COST / ⚠ THIN MARGIN** (orange): at today's supplier price you make a loss or less than
  half your usual margin. The row shows the margin and a suggested price.
- **↓ ROOM TO CUT** (blue): you're priced well above cost + margin, so you could lower the price.

For these rows choose **UPDATE COST** in column A. On apply, that records the new supplier price as
the product's cost (admin **Inventory & pricing** then shows the true margin). **It never changes the
selling price:** do that in admin. The scan can't see the recorded costs (they're admin-only), so it
compares against your selling price, not the old cost.

## Recent posts and stock check
- Only posts from the **last 7 days** of each chat are offered as new products (`new_item_days`
  in `config.json`). Days count back from the chat's newest message, so a late export still works.
- Each scan remembers the last date each supplier posted each product you sell
  (`intake/stock_seen.json`). When there are new exports, it writes
  `intake/review/<date>-stock-check.xlsx` listing products still on your site that a supplier
  **marked sold out** ("sold out", "out of stock", "imeisha"…) or **hasn't reposted for 21+ days**
  (`stock_check_days`). A later repost clears the sold-out flag.
- Nothing is hidden automatically: confirm with the supplier, then update the product in admin.
- If a supplier's chat hasn't been exported for 14+ days, the scan and the log remind you.

## When did it last run?
Every `scan`, `setnames` and `apply` adds a dated line to `intake/RUN_LOG.md`, including
"No chat exports in the Drive folder" days. Open that file, or run
`python3 scripts/intake/catalogue_intake.py log` to see recent runs and the date of the last
catalogue change.

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
- A whole group can be pinned to one category with `group_categories` in `config.json`
  (Jatin Toy Shop -> `toy-shop`).
- Chats and photos live in `intake/` (git-ignored): never committed, never public.

## Files
`scripts/intake/catalogue_intake.py` (commands: `scan`, `contact`, `setnames`, `apply`, `log`),
`scripts/intake/config.json`.
