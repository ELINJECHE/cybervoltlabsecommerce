/** @type {import('next').NextConfig} */
const nextConfig = {
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
