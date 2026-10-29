/** @type {import('next').NextConfig} */
// Stamped into every build so the admin can tell whether edits were saved after the site was last built.
const nextConfig = {
  env: { NEXT_PUBLIC_BUILD_TIME: new Date().toISOString() },
  // Static export for cheap hosting on Vercel/Netlify.
  // Note: this disables Route Handlers/API routes and next/image's server-side
  // optimization — checkout submits client-side to an external webhook instead
  // (see lib/webhook.ts), and images are served unoptimized (see images below).
  output: "export",
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
