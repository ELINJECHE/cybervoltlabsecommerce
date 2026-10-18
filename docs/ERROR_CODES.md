# Error codes

Generated from `lib/errors.ts` (run `node scripts/gen-error-docs.mjs` after changing it).

When something fails, customers see a plain sentence and a reference code, with a WhatsApp link that
already quotes the code. The technical error goes to the browser console only, and the code (never
personal data) is sent as an analytics event named `app_error`. Staff screens show the code plus the
real detail. Mistakes the customer can fix, such as a wrong password, are shown specifically and have no
code.

| Code | What it means (for you) | What the customer sees |
|---|---|---|
| `CV-NET-01` | The request never reached us: no internet, a dropped connection, or a blocked request. | We couldn't connect. Check your internet and try again. |
| `CV-AUTH-01` | The account service refused the site's API key (key disabled, rotated or wrong). Check the Supabase key in the build settings. | Our account service has a problem on our side. Please try again later, or message us on WhatsApp. |
| `CV-AUTH-02` | Too many login, sign-up or reset attempts (rate limit). | Too many attempts. Please wait a few minutes and try again. |
| `CV-AUTH-03` | The account service couldn't send an email (confirmation or password reset), or sign-ups are switched off. | We couldn't send that email right now. Please try again shortly. |
| `CV-AUTH-04` | Any other account-service failure. The raw error is in the browser console. | Something went wrong with your account request. Please try again. |
| `CV-ORDER-01` | The order sheet address (NEXT_PUBLIC_ORDER_WEBHOOK_URL) isn't set in this build. | We can't take orders on the site right now. Please order on WhatsApp instead. |
| `CV-ORDER-02` | The order sheet (Google Apps Script) didn't accept the order: it returned an error or couldn't be reached. | We couldn't send your order just now. Please try again, or place it on WhatsApp. |
| `CV-ORDER-03` | A customer's M-Pesa payment confirmation couldn't be sent to the order sheet. | We couldn't send your payment confirmation. Please try again, or send your M-Pesa code to us on WhatsApp. |
| `CV-PAY-01` | The automatic M-Pesa prompt (PayHero) couldn't be started. The order is saved and the customer pays by Till. | We couldn't send the M-Pesa prompt automatically, but your order is saved. Pay by Till below, then confirm. |
| `CV-DATA-01` | The product list or search index couldn't be loaded. | We couldn't load the product list. Please refresh the page. |
| `CV-ADM-01` | Admin: a save or delete was refused (permissions) or failed in the database. | That change couldn't be saved. |
| `CV-ADM-02` | Admin: a product photo couldn't be uploaded. | The photo couldn't be uploaded. |
| `CV-ADM-03` | Admin: the request to publish (rebuild) the site failed. | The site couldn't be published. |
| `CV-ADM-04` | Admin: a list or product couldn't be loaded. | That page couldn't load its data. |
| `CV-GEN-01` | An unexpected error with no better match. The raw error is in the browser console. | Something went wrong. Please try again, or message us on WhatsApp. |

## How to use this
- A customer messages you a code: find it above, then check the item under "What it means".
- **CV-AUTH-01** after a key change means the site was built with an old or disabled Supabase key.
  Rebuild with the current key.
- **CV-ORDER-01 / 02** point at the order sheet: the web-app address in the build settings, or the Apps Script deployment.
- To add a code, add it to `ERROR_CODES` in `lib/errors.ts` and regenerate this file. Keep the list short.
