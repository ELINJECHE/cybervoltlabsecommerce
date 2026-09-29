// Set NEXT_PUBLIC_DEPLOY_HOOK_URL in .env.local (see docs/SUPABASE_SETUP.md
// step 8) — a Vercel/Netlify deploy hook that rebuilds the static export
// after an admin edit. Best-effort: a missing/failing hook must never block
// the admin from saving, since the database write already succeeded.
const DEPLOY_HOOK_URL = process.env.NEXT_PUBLIC_DEPLOY_HOOK_URL;

export async function triggerRebuild(): Promise<{ triggered: boolean }> {
  if (!DEPLOY_HOOK_URL) return { triggered: false };

  try {
    await fetch(DEPLOY_HOOK_URL, { method: "POST" });
    return { triggered: true };
  } catch (err) {
    console.error("Deploy hook request failed:", err);
    return { triggered: false };
  }
}
