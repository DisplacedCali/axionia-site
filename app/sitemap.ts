import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://axionia.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/platform", priority: 0.9 },
    { path: "/who-its-for", priority: 0.85 },
    { path: "/platform/outputs", priority: 0.85 },
    { path: "/methodology", priority: 0.8 },
    { path: "/research", priority: 0.8 },
    { path: "/pricing", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/privacy", priority: 0.4 },
    { path: "/request-report", priority: 0.7 },
  ];

  return pages.map((p) => ({
    url: `${SITE}${p.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.priority,
  }));
}
