import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "../icons";
import { SITE_NAME, SITE_URL } from "../site";
import { CALCULATORS } from "./data";

const title = "Financijski kalkulatori";
const description =
  "Besplatni kalkulatori za osobne financije: dnevni budžet, pretplate, fond za hitne slučajeve, cilj štednje i sitni troškovi. Bez prijave, ništa se ne sprema.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/kalkulatori" },
  openGraph: { type: "website", locale: "hr_HR", siteName: SITE_NAME, url: "/kalkulatori", title: `${title} | ${SITE_NAME}`, description },
  twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
};

export default function Calculators() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: title,
        itemListElement: CALCULATORS.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${SITE_URL}/kalkulatori/${c.slug}` })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Kalkulatori", item: `${SITE_URL}/kalkulatori` },
        ],
      },
    ],
  };
  return (
    <main className="wrap blog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="blog-head">
        <div className="label">Kalkulatori</div>
        <h1>Brojke, <em className="serif">u sekundi.</em></h1>
        <p className="blog-lead">Jednostavni kalkulatori za svakodnevne financijske odluke. Rade u pregledniku, ništa se ne šalje ni ne sprema.</p>
      </div>
      <ul className="post-list calc-list">
        {CALCULATORS.map((c) => (
          <li key={c.slug}>
            <Link href={`/kalkulatori/${c.slug}`} className="post-row calc-list-row">
              <span className="calc-list-icon" aria-hidden="true"><Icon name={c.icon} size={22} stroke={1.8} /></span>
              <span>
                <h2>{c.name}</h2>
                <p>{c.lead}</p>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
