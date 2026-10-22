// One place for every error a customer or staff member can hit. Each failure gets a short code
// (CV-AREA-NN) and a plain-language message. The customer sees the sentence and the code; the
// raw technical error goes to the browser console only. The key to the codes is below and in
// docs/ERROR_CODES.md: keep the two in step, and keep the list short.

export const ERROR_CODES = {
  "CV-NET-01": {
    meaning: "The request never reached us: no internet, a dropped connection, or a blocked request.",
    customer: "We couldn't connect. Check your internet and try again.",
  },
  "CV-AUTH-01": {
    meaning: "The account service refused the site's API key (key disabled, rotated or wrong). Check the Supabase key in the build settings.",
    customer: "Our account service has a problem on our side. Please try again later, or message us on WhatsApp.",
  },
  "CV-AUTH-02": {
    meaning: "Too many login, sign-up or reset attempts (rate limit).",
    customer: "Too many attempts. Please wait a few minutes and try again.",
  },
  "CV-AUTH-03": {
    meaning: "The account service couldn't send an email (confirmation or password reset), or sign-ups are switched off.",
    customer: "We couldn't send that email right now. Please try again shortly.",
  },
  "CV-AUTH-04": {
    meaning: "Any other account-service failure. The raw error is in the browser console.",
    customer: "Something went wrong with your account request. Please try again.",
  },
  "CV-ORDER-01": {
    meaning: "The order sheet address (NEXT_PUBLIC_ORDER_WEBHOOK_URL) isn't set in this build.",
    customer: "We can't take orders on the site right now. Please order on WhatsApp instead.",
  },
  "CV-ORDER-02": {
    meaning: "The order sheet (Google Apps Script) didn't accept the order: it returned an error or couldn't be reached.",
    customer: "We couldn't send your order just now. Please try again, or place it on WhatsApp.",
  },
  "CV-ORDER-03": {
    meaning: "A customer's M-Pesa payment confirmation couldn't be sent to the order sheet.",
    customer: "We couldn't send your payment confirmation. Please try again, or send your M-Pesa code to us on WhatsApp.",
  },
  "CV-PAY-01": {
    meaning: "The automatic M-Pesa prompt (PayHero) couldn't be started. The order is saved and the customer pays by Till.",
    customer: "We couldn't send the M-Pesa prompt automatically, but your order is saved. Pay by Till below, then confirm.",
  },
  "CV-LOY-01": {
    meaning: "Points or the welcome voucher couldn't be applied to an order (database not set up for rewards, or the offer changed).",
    customer: "We couldn't apply your rewards just now. Untick them to continue, or try again.",
  },
  "CV-DATA-01": {
    meaning: "The product list or search index couldn't be loaded.",
    customer: "We couldn't load the product list. Please refresh the page.",
  },
  "CV-ADM-01": {
    meaning: "Admin: a save or delete was refused (permissions) or failed in the database.",
    customer: "That change couldn't be saved.",
  },
  "CV-ADM-02": {
    meaning: "Admin: a product photo couldn't be uploaded.",
    customer: "The photo couldn't be uploaded.",
  },
  "CV-ADM-03": {
    meaning: "Admin: the request to publish (rebuild) the site failed.",
    customer: "The site couldn't be published.",
  },
  "CV-ADM-04": {
    meaning: "Admin: a list or product couldn't be loaded.",
    customer: "That page couldn't load its data.",
  },
  "CV-GEN-01": {
    meaning: "An unexpected error with no better match. The raw error is in the browser console.",
    customer: "Something went wrong. Please try again, or message us on WhatsApp.",
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface AppError {
  /** Set for failures we can't explain to the customer in detail. */
  code?: ErrorCode;
  message: string;
}

// Mistakes the customer can fix themselves. These stay specific and carry no code.
const USER_FIXABLE: [RegExp, string][] = [
  [/invalid login credentials|invalid credentials|wrong password/i, "That email or password isn't right. Check them and try again."],
  [/email not confirmed/i, "Please confirm your email first. Check your inbox for the link we sent."],
  [/already (?:been )?registered|already exists/i, "That email already has an account. Try logging in instead."],
  [/unable to validate email|invalid email|email address .* invalid/i, "That email address doesn't look right."],
  [/expired|invalid.*(?:token|otp|link)|(?:token|otp|link).*invalid/i, "This link has expired. Please request a new one."],
];

const raw = (e: unknown): string => (e instanceof Error ? e.message : typeof e === "string" ? e : "");

// Turns any error into something safe to show. `fallback` is used when nothing more specific fits.
export function toAppError(e: unknown, fallback: ErrorCode = "CV-GEN-01"): AppError {
  const text = raw(e);
  console.error(`[${fallback}]`, e); // the technical detail stays here, for whoever is debugging

  for (const [rx, message] of USER_FIXABLE) if (rx.test(text)) return { message };
  // Password rules ("Password should be at least 6 characters") are helpful as written.
  if (/password/i.test(text) && /(should|must|least|weak|short|same|different)/i.test(text)) return { message: text };

  let code: ErrorCode = fallback;
  if (/failed to fetch|networkerror|network request failed|load failed|timed? ?out|offline/i.test(text)) code = "CV-NET-01";
  else if (/api key|apikey|legacy|jwt|invalid key/i.test(text)) code = "CV-AUTH-01";
  else if (/rate limit|too many requests|over_.*_rate_limit|429/i.test(text)) code = "CV-AUTH-02";
  else if (/sending .*email|email .*(?:send|rate)|signups? .*(?:not allowed|disabled)/i.test(text)) code = "CV-AUTH-03";
  else if (/no order webhook configured/i.test(text)) code = "CV-ORDER-01";
  else if (/order webhook responded/i.test(text)) code = "CV-ORDER-02";
  return { code, message: ERROR_CODES[code].customer };
}

// Staff see the code and the real detail, since they can act on it.
export function toAdminMessage(e: unknown, code: ErrorCode, fallbackDetail = ""): string {
  const detail = raw(e) || fallbackDetail;
  console.error(`[${code}]`, e);
  return detail ? `${code}: ${detail}` : `${code}: ${ERROR_CODES[code].meaning}`;
}
