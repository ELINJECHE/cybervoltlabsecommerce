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
3. **Review** the sheet: column A = `ADD`, `UPDATE PRICE` or `SKIP` (blank = ignored). Check names,
   categories and the *Final sell price* (supplier price + markup, editable).
4. **Tell Claude "apply the approved catalogue rows"**. It runs
   `SUPABASE_SERVICE_KEY=... python3 scripts/intake/catalogue_intake.py apply` (add `--dry-run` to
   preview). The service key is passed for that one run only and is never stored.
5. **Publish changes** in the admin panel (one Netlify build for the whole day's changes).

## Rules built in
- Exports are cumulative, so posts already seen are skipped (`intake/processed.json`).
- Markup: cost +25%, rounded up to the next KSh 50. Groups named in `retail_price_sources`
  (your own broadcast groups) get no markup. Edit `scripts/intake/config.json`.
- Branded shoes must be renamed with neutral "-style" wording; `apply` refuses brand names.
- Category must already exist; new categories are created by hand first.
- Chats and photos live in `intake/` (git-ignored): never committed, never public.

## Files
`scripts/intake/catalogue_intake.py` (commands: `scan`, `contact`, `setnames`, `apply`),
`scripts/intake/config.json`.
