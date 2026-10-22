// Loyalty rules, as the screens describe them. The database enforces the same numbers
// (docs/sql/loyalty_v2.sql): change both together.
//
//   1 point = KSh 1.
//   A paid order earns 1% of its items total, or 1.5% when the items total is KSh 20,000+.
//   Points are used at checkout: at least 100, at most the smaller of 10% of the items total or KSh 1,000.
//   Every account gets one welcome voucher: KSh 200 off a first order of KSh 4,000+.
//
// Everything stays hidden until NEXT_PUBLIC_LOYALTY_V2 is "true", which you set only after running
// docs/sql/loyalty_v2.sql in Supabase.

export const LOYALTY_V2 = process.env.NEXT_PUBLIC_LOYALTY_V2 === "true";

export const TIER_THRESHOLD = 20000;
export const REDEEM_MIN = 100;
export const REDEEM_CAP_MAX = 1000;
export const WELCOME_AMOUNT = 200;
export const WELCOME_MIN_ORDER = 4000;

export interface WelcomeVoucher {
  amount: number;
  minOrder: number;
  used: boolean;
}

/** Points a paid order earns. Whole-number maths so it always matches the database. */
export function pointsEarned(items: number, discounts = 0): number {
  const net = Math.max(items - discounts, 0);
  return items >= TIER_THRESHOLD ? Math.floor((net * 15) / 1000) : Math.floor(net / 100);
}

/** The most points that can be used on an order (0 when below the 100-point minimum). */
export function maxRedeemable(items: number, voucherOff: number, balance: number): number {
  const cap = Math.min(Math.floor((items - voucherOff) / 10), REDEEM_CAP_MAX);
  const usable = Math.min(balance, cap);
  return usable >= REDEEM_MIN ? usable : 0;
}
