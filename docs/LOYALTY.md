# Loyalty: points and the welcome voucher

## The rules
| | |
|---|---|
| Point value | **1 point = KSh 1** |
| Earning | A **paid** order earns **1%** of its items total, or **1.5%** when the items total is **KSh 20,000 or more**. Discounts (voucher, points) don't earn. Delivery never earns. |
| Using points | At checkout, at least **100 points**, and at most the smaller of **10% of the items total** or **KSh 1,000** per order. |
| Welcome voucher | One per account: **KSh 200 off a first order whose items total is KSh 4,000 or more.** Replaces the old 100 free points. |

Examples: KSh 4,458 of items earns 44 points; KSh 31,000 earns 465; KSh 66,000 earns 990.

## Turning it on (one time)
1. In Supabase, run `docs/SUPABASE_SETUP.md`'s schema and `docs/sql/shop_orders.sql` first if you haven't.
2. Run **`docs/sql/loyalty_v2.sql`** in the Supabase SQL Editor (safe to run twice).
3. Set the build variable **`NEXT_PUBLIC_LOYALTY_V2=true`** (Netlify, or `.env.local` for localhost) and rebuild.
Until step 3 the site shows no points or voucher anywhere, so nothing is promised early.

## How staff run it (Admin → Orders)
- Marking an order **paid** (or dispatched / delivered) credits the customer's points, once.
- Marking it **cancelled** gives back any points used, frees the voucher, and takes back points that order earned.
- Guest orders (no account) earn and use nothing.
- Manual fixes: add a row to `loyalty_ledger` (reason `adjustment`, positive or negative points) from the Table Editor.
- A voucher is used up when the order is placed. If a customer never pays, cancel the order and the voucher comes back.

## What changed for existing customers
The old 100-point newsletter bonus is gone: balances are now read from the new `loyalty_ledger`, so those 100 points no longer count. Every existing account can still claim its welcome voucher the next time they log in.

## Where to change the numbers
`lib/loyalty.ts` (what the screens say) **and** `docs/sql/loyalty_v2.sql` (what the database enforces). Keep them identical.
