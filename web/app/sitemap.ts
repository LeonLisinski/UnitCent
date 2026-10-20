import type { MetadataRoute } from "next";
import { publishedPosts } from "../content/blog";
import { CALCULATORS } from "./kalkulatori/data";
import { SITE_URL } from "./site";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = publishedPosts();
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
    { url: `${SITE_URL}/kalkulatori`, changeFrequency: "monthly", priority: 0.7 },
    ...CALCULATORS.map((c) => ({ url: `${SITE_URL}/kalkulatori/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/privatnost`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/uvjeti`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
