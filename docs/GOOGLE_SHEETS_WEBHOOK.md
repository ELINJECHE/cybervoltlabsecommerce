# Google Sheets order webhook

This turns a Google Sheet into the checkout webhook — every order placed on the site appends a
row. No backend, no third-party service account needed, just your own Google account.

## 1. Create the sheet

1. Create a new Google Sheet (e.g. "Cybervolt Orders").
2. Rename the first tab to `Orders`.
3. In row 1, add these headers (one per column, A through H):

   ```
   Timestamp | Customer Name | Phone | Delivery Address | Notes | Items | Subtotal (KES) | Item Count
   ```

## 2. Add the Apps Script

1. In the sheet, go to **Extensions → Apps Script**.
2. Delete anything in the editor and paste in the script below.
3. Click **Save** (name the project anything, e.g. "Cybervolt Order Webhook").

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  var body = JSON.parse(e.postData.contents);

  var itemsSummary = body.items
    .map(function (item) {
      var color = item.color ? ' (' + item.color + ')' : '';
      return item.name + color + ' x' + item.quantity + ' @ KES ' + item.unitPrice;
    })
    .join('\n');

  var itemCount = body.items.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  sheet.appendRow([
    body.submittedAt || new Date().toISOString(),
    body.customerName || '',
    body.phone || '',
    body.deliveryAddress || '',
    body.notes || '',
    itemsSummary,
    body.subtotal || 0,
    itemCount,
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
     (This has to be "Anyone" for the site's checkout page to be able to POST to it without
     Google login — it can only receive data via this specific script, it does not expose your
     sheet for reading.)
4. Click **Deploy**, then **Authorize access** and approve the permissions prompt (it's your own
   script, on your own account).
5. Copy the **Web app URL** it gives you — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Wire it into the site

Paste that URL into `.env.local`:

```
NEXT_PUBLIC_ORDER_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
```

Restart the dev server (or redeploy) after changing this — send me the URL and I'll drop it in
for you.

## Notes

- If you ever need to change the script, you must create a **new deployment version**
  (Deploy → Manage deployments → Edit → New version) — saving the script alone does not update
  the live URL's behavior.
- This script has no auth check beyond the unguessable deployment URL. That's an acceptable
  tradeoff for an order-capture form (same posture as commonly used for this kind of no-backend
  webhook), but don't put anything sensitive (e.g. card numbers) through this path — checkout
  never collects payment details, only order/contact info, which matches this schema.
