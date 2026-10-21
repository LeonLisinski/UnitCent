// Zakazani članci: čitaju se izravno iz web/content/blog (isti repo), pa admin uvijek pokazuje raspored iz koda.
// Novi članak se vidi nakon novog builda ili EAS updatea admina.
import { allPosts } from "../../../web/content/blog";

export interface Scheduled {
  slug: string;
  title: string;
  published: string;
}

export function blogSchedule(today: string, count = 5): { next: Scheduled[]; scheduledCount: number; last: Scheduled | null } {
  const pick = (p: { slug: string; title: string; published: string }): Scheduled => ({ slug: p.slug, title: p.title, published: p.published });
  const future = allPosts.filter((p) => p.published > today).sort((a, b) => a.published.localeCompare(b.published));
  const past = allPosts.filter((p) => p.published <= today); // allPosts je od najnovijeg
  return { next: future.slice(0, count).map(pick), scheduledCount: future.length, last: past[0] ? pick(past[0]) : null };
}
