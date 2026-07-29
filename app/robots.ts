import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Client and admin surfaces carry no public value and shouldn't be indexed.
      disallow: ["/admin", "/dashboard", "/api", "/login", "/signup"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
