import type { MetadataRoute } from "next";

const SITE_URL = "https://cybervoltlabs.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
