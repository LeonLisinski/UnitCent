import type { Metadata } from "next";
import Link from "next/link";
import { publishedPosts, readingMinutes } from "../../content/blog";
import { SITE_NAME, SITE_URL } from "../site";
import { formatDate } from "./format";
import { Icon } from "../icons";

/** Ikona po kategoriji: brže skeniranje popisa okom (prepoznavanje prije čitanja). */
const CATEGORY_ICON: Record<string, string> = { Budžet: "chart", Štednja: "target", Troškovi: "cart", Odnosi: "house", Alati: "calc" };

const title = "Blog o osobnim financijama";
const description =
  "Praktični vodiči o budžetu, štednji i praćenju troškova: kako napraviti mjesečni budžet, koliko dnevno smiješ potrošiti, pretplate, režije i štednja za hitne slučajeve.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", locale: "hr_HR", siteName: SITE_NAME, url: "/blog", title: `${title} | ${SITE_NAME}`, description },
  twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
};

// Osvježava se svakih sat vremena: zakazani članak se pojavi na svoj dan bez novog deploya.
export const revalidate = 3600;

export default function BlogIndex() {
  const posts = publishedPosts();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        url: `${SITE_URL}/blog`,
        name: `${SITE_NAME} blog`,
        description,
        inLanguage: "hr",
        publisher: { "@id": `${SITE_URL}/#org` },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          url: `${SITE_URL}/blog/${p.slug}`,
          datePublished: p.published,
          dateModified: p.updated ?? p.published,
        })),
      },
      { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        ],
      },
    ],
  };

  return (
    <main className="wrap blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="blog-head">
        <div className="label">Blog</div>
        <h1>Novac, <em className="serif">jednostavno.</em></h1>
        <p className="blog-lead">Kratki i točni vodiči o budžetu, štednji i praćenju troškova. Jasno i bez žargona.</p>
      </div>

      <ul className="post-list">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="post-row">
              <span className="post-meta post-meta-icon">
                <Icon name={CATEGORY_ICON[p.category] ?? "file"} size={14} stroke={2} />
                {p.category} · {readingMinutes(p)} min
              </span>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="blog-updated muted">Zadnje ažurirano {formatDate(posts.map((p) => p.updated ?? p.published).sort().at(-1)!)}</p>
    </main>
  );
}
