// Admin edits are saved to the database straight away, but the public storefront
// is a static snapshot — it only changes after a rebuild. Each rebuild uses
// Netlify build credits, so saving never rebuilds on its own: the admin makes any
// number of edits, then presses "Publish changes" once.
//
// NEXT_PUBLIC_DEPLOY_HOOK_URL is a Netlify build hook (Project configuration →
// Build & deploy → Build hooks). Without it the button explains what to do instead.
const DEPLOY_HOOK_URL = process.env.NEXT_PUBLIC_DEPLOY_HOOK_URL;

export const publishConfigured = Boolean(DEPLOY_HOOK_URL);

const CHANGES_KEY = "cv_unpublished_changes";
const LAST_PUBLISH_KEY = "cv_last_publish_at";
export const CHANGES_EVENT = "cv-unpublished-changed";

// A rebuild already takes a minute or two; this stops repeat clicks from
// queuing extra (paid) builds.
export const PUBLISH_COOLDOWN_MS = 2 * 60 * 1000;

export interface UnpublishedChanges {
  count: number;
  since: string;
}

function notifyChanged() {
  window.dispatchEvent(new Event(CHANGES_EVENT));
}

// Remembered per browser: it only tracks edits made on this device.
export function markUnpublished(): void {
  try {
    const current = getUnpublished();
    localStorage.setItem(
      CHANGES_KEY,
      JSON.stringify({ count: (current?.count ?? 0) + 1, since: current?.since ?? new Date().toISOString() })
    );
  } catch {
    // Storage blocked — the edit is still saved; the counter just won't update.
  }
  notifyChanged();
}

export function getUnpublished(): UnpublishedChanges | null {
  try {
    const raw = localStorage.getItem(CHANGES_KEY);
    return raw ? (JSON.parse(raw) as UnpublishedChanges) : null;
  } catch {
    return null;
  }
}

export function msUntilNextPublish(): number {
  try {
    const last = Number(localStorage.getItem(LAST_PUBLISH_KEY) ?? 0);
    return Math.max(0, PUBLISH_COOLDOWN_MS - (Date.now() - last));
  } catch {
    return 0;
  }
}

export type PublishResult = "started" | "not-configured" | "cooling-down" | "failed";

export async function publishChanges(): Promise<PublishResult> {
  if (!DEPLOY_HOOK_URL) return "not-configured";
  if (msUntilNextPublish() > 0) return "cooling-down";

  try {
    // no-cors: the hook doesn't send CORS headers, so the response can't be read —
    // but the request is still delivered and starts the build.
    await fetch(DEPLOY_HOOK_URL, { method: "POST", mode: "no-cors" });
  } catch (err) {
    console.error("Publish request failed:", err);
    return "failed";
  }

  try {
    localStorage.removeItem(CHANGES_KEY);
    localStorage.setItem(LAST_PUBLISH_KEY, String(Date.now()));
  } catch {
    // Storage blocked — publishing still worked.
  }
  notifyChanged();
  return "started";
}
