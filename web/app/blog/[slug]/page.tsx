import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts, readingMinutes } from "../../../content/blog";
import { SITE_NAME, SITE_URL } from "../../site";
import { formatDate } from "../format";
import { Markdown } from "../Markdown";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "hr_HR",
      siteName: SITE_NAME,
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      section: post.category,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const related = (post.related ?? []).map(getPost).filter((p) => p !== undefined).slice(0, 3);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.description,
      abstract: post.summary.join(" "),
      articleSection: post.category,
      inLanguage: "hr",
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      mainEntityOfPage: url,
      url,
      image: `${url}/opengraph-image`,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/icon-512.png` } },
      ...(post.sources?.length ? { citation: post.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })) } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }

  return (
    <main className="wrap blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }} />
      <article className="post">
        <nav className="crumbs" aria-label="Putanja">
          <Link href="/">Početna</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
        </nav>
        <div className="post-meta">
          {post.category} · {readingMinutes(post)} min čitanja · <time dateTime={post.updated ?? post.published}>{formatDate(post.updated ?? post.published)}</time>
        </div>
        <h1>{post.title}</h1>

        <section className="post-summary" aria-labelledby="ukratko">
          <h2 id="ukratko" className="label">Ukratko</h2>
          <ul>{post.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>

        <div className="post-body">
          <Markdown source={post.body} />
        </div>

        {post.faq?.length ? (
          <section className="post-faq" aria-labelledby="pitanja">
            <h2 id="pitanja">Česta pitanja</h2>
            <div className="faq">
              {post.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="a">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {post.sources?.length ? (
          <section className="post-sources" aria-labelledby="izvori">
            <h2 id="izvori" className="label">Izvori</h2>
            <ul>
              {post.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="post-note muted">Članak je informativan i ne predstavlja individualni financijski savjet.</p>
      </article>

      <section className="post-cta" aria-labelledby="cta">
        <h2 id="cta">Znaj koliko smiješ potrošiti. <em className="serif">Svaki dan.</em></h2>
        <p>UnitCent iz tvog plana računa dnevni budžet, pretplate knjiži sam, a račune skenira i razvrstava po kategorijama.</p>
        <Link className="btn primary" href="/#prijava">Javi mi kad izađe</Link>
      </section>

      {related.length ? (
        <section className="post-related" aria-labelledby="povezano">
          <h2 id="povezano" className="label">Pročitaj i</h2>
          <ul className="post-list">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="post-row">
                  <span className="post-meta">{p.category} · {readingMinutes(p)} min</span>
                  <h3>{p.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
