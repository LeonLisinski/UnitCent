import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "../../../content/blog";
import { SITE_NAME, SITE_URL } from "../../site";
import { Calculator } from "../Calc";
import { CALCULATORS, getCalc } from "../data";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// Povezani članci mogu biti zakazani: popis se osvježava kao i blog.
export const revalidate = 3600;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCalc((await params).slug);
  if (!c) return {};
  const url = `/kalkulatori/${c.slug}`;
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "hr_HR", siteName: SITE_NAME, url, title: c.title, description: c.description },
    twitter: { card: "summary_large_image", title: c.title, description: c.description },
  };
}

export default async function CalcPage({ params }: Props) {
  const c = getCalc((await params).slug);
  if (!c) notFound();
  const url = `${SITE_URL}/kalkulatori/${c.slug}`;
  const related = c.related.map(getPost).filter((p) => p !== undefined).slice(0, 3);
  const others = CALCULATORS.filter((x) => x.slug !== c.slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: c.name,
        url,
        description: c.description,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        inLanguage: "hr",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Kalkulatori", item: `${SITE_URL}/kalkulatori` },
          { "@type": "ListItem", position: 3, name: c.name, item: url },
        ],
      },
    ],
  };

  return (
    <main className="wrap blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="post">
        <nav className="crumbs" aria-label="Putanja">
          <Link href="/">Početna</Link>
          <span aria-hidden="true">/</span>
          <Link href="/kalkulatori">Kalkulatori</Link>
        </nav>
        <h1>{c.title.split("?")[0]}{c.title.includes("?") ? "?" : ""}</h1>
        <p className="blog-lead">{c.lead}</p>

        <Calculator slug={c.slug} />

        <section className="post-body" aria-labelledby="kako">
          <h2 id="kako">Kako računamo</h2>
          <ul>{c.how.map((h, i) => <li key={i}>{h}</li>)}</ul>
          <p className="muted calc-privacy">Kalkulator radi samo u tvom pregledniku. Ništa se ne šalje ni ne sprema.</p>
        </section>

        <section className="post-faq" aria-labelledby="pitanja">
          <h2 id="pitanja">Česta pitanja</h2>
          <div className="faq">
            {c.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p className="a">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <section className="post-cta" aria-labelledby="cta">
        <h2 id="cta">Ovo, ali svaki dan. <em className="serif">Samo od sebe.</em></h2>
        <p>UnitCent iz tvog plana svaki dan računa koliko smiješ potrošiti, pretplate knjiži sam, a račune skenira i razvrstava.</p>
        <Link className="btn primary" href="/#prijava">Javi mi kad izađe</Link>
      </section>

      {related.length ? (
        <section className="post-related" aria-labelledby="clanci">
          <h2 id="clanci" className="label">Pročitaj i</h2>
          <ul className="post-list">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="post-row">
                  <span className="post-meta">{p.category}</span>
                  <h3>{p.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="post-related" aria-labelledby="drugi">
        <h2 id="drugi" className="label">Ostali kalkulatori</h2>
        <ul className="post-list">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/kalkulatori/${o.slug}`} className="post-row">
                <h3>{o.name}</h3>
                <p>{o.lead}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
