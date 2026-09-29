# Deploying to Netlify

This is a static export (`output: "export"` in `next.config.mjs`) — Netlify
serves the prebuilt `out/` folder directly, no Next.js server runtime
required. `netlify.toml` already sets the build command and publish
directory.

## 1. Push the code to GitHub

The local repo has no remote configured yet. Create an empty repo on
GitHub (no README/license — keep it empty), then:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Create the Netlify site

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Connect your GitHub account, select this repo.
3. Build settings should auto-fill from `netlify.toml` (`npm run build`, publish `out`).
   If Netlify offers to install the **"Next.js Runtime"** plugin, **skip it** —
   this is a static export, not an SSR deployment.

## 3. Set environment variables

Site settings → **Environment variables** → add each of these (values from
your local `.env.local` — never commit that file):

- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_MPESA_TILL`
- `NEXT_PUBLIC_ORDER_WEBHOOK_URL`
- `NEXT_PUBLIC_GA4_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEPLOY_HOOK_URL` (leave blank for now — set after step 5)

All `NEXT_PUBLIC_*` values are baked into the site at build time, so a
variable added or changed here only takes effect after the next build.

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` or any PayHero credential here —
those belong only in Supabase Edge Function secrets (see
`docs/PAYHERO_SETUP.md`), never in the Next.js build environment.

## 4. First deploy

Trigger a deploy (**Deploys** → **Trigger deploy** → **Deploy site**, or just
push a commit). Confirm it builds clean and the site loads at the
`*.netlify.app` URL Netlify assigns.

## 5. Custom domain — cybervoltlabs.co.ke

1. Site settings → **Domain management** → **Add a domain** → enter `cybervoltlabs.co.ke`.
2. Netlify shows the DNS records to add at your domain registrar (either a
   full switch to Netlify DNS, or just adding the A/CNAME records it gives
   you while keeping your current registrar). Follow whichever option it
   presents.
3. Wait for DNS to propagate (can take a few minutes to a few hours), then
   Netlify auto-provisions a free HTTPS certificate.

## 6. Wire up the admin "rebuild-on-save" hook

1. Site settings → **Build & deploy** → **Build hooks** → **Add build hook**
   (name it e.g. "admin-save"). Copy the generated URL.
2. Set `NEXT_PUBLIC_DEPLOY_HOOK_URL` in the environment variables (step 3)
   to that URL.
3. Trigger one more deploy so the hook URL is baked into the built site —
   from then on, every save in `/admin` (product or category) calls this
   hook automatically and Netlify rebuilds within a minute or two.

## Notes

- Every subsequent code change: `git push` → Netlify rebuilds automatically.
- Every subsequent catalog change via `/admin`: rebuild happens automatically
  via the build hook — no manual redeploy needed.
- `sitemap.xml` and `robots.txt` already reference `https://cybervoltlabs.co.ke`
  (set in `app/sitemap.ts` / `app/robots.ts`), so no changes needed there once
  the custom domain is live.
