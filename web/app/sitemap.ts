import type { MetadataRoute } from "next";
import { posts } from "../content/blog";
import { SITE_URL } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = posts.map((p) => p.updated ?? p.published).sort().at(-1);
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated ?? p.published,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privatnost`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/uvjeti`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
