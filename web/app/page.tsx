import Link from "next/link";
import { Icon } from "./icons";
import { LogoMark, Wordmark } from "./Logo";
import { CountUp, Equation, ScanStage } from "./Motion";
import { Waitlist } from "./Waitlist";
import { CONTACT_EMAIL, FAQ, SITE_NAME, SITE_URL } from "./site";

/*
 * Jedan plan, isti brojevi svugdje (primanja 1.633 − obavezno 856,33 − štednja 200 = 576,67;
 * potrošeno do jutros 237,40; ostaje 339,27; 17 dana uključujući danas; 339,27 / 17 = 19,96).
 * Isto je u Motion.tsx (jednadžba). Tekst CTA-a je svugdje isti.
 */
const DAILY = 19.96;

const SUBS = [
  "Spotify", "Najam", "Netflix", "Režije", "Kredit", "Teretana",
  "RTV pristojba", "Mobitel", "HBO Max", "Struja", "iCloud", "Osiguranje",
];

function PhoneMock() {
  return (
    <div className="phone-wrap">
      <div className="phone" role="img" aria-label="Početni ekran aplikacije UnitCent: danas smiješ potrošiti 19,96 €, potrošeno 237,40 € od 576,67 € ovaj mjesec">
        <div className="p-top">
          <div><small className="muted">Četvrtak, 15. listopada</small><br /><b>Bok, Leon</b></div>
          <span className="avatar">L</span>
        </div>
        <div className="p-hero">
          <div className="label">Danas smiješ</div>
          <div className="amt num">19,96 €</div>
          <small>Još 17 dana u mjesecu</small>
        </div>
        <div className="p-card">
          <div className="row"><span className="label" style={{ flex: 1 }}>Ovaj mjesec</span><span className="p-pill">Po planu</span></div>
          <div className="row" style={{ justifyContent: "space-between", fontWeight: 700 }}><span className="num">Potrošeno 237,40 €</span><small className="muted num">od 576,67 €</small></div>
          <div className="bar"><i style={{ width: "41%" }} /></div>
        </div>
        <div className="p-card" style={{ gap: 0 }}>
          <div className="row"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-hrana)" }}><Icon name="cart" size={16} /></span><span className="grow">Lidl<small>Jučer · Hrana</small></span><span className="amount">−23,60 €</span></div>
          <div className="row"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-auto)" }}><Icon name="car" size={16} /></span><span className="grow">INA gorivo<small>Pon · Auto</small></span><span className="amount">−82,00 €</span></div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, email: CONTACT_EMAIL },
      { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: SITE_NAME, inLanguage: "hr", publisher: { "@id": `${SITE_URL}/#org` } },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "FinanceApplication",
        operatingSystem: "iOS, Android",
        inLanguage: "hr",
        description: "Hrvatska aplikacija za praćenje troškova s AI skeniranjem računa, automatskim pretplatama i dnevnim limitom potrošnje.",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#org` },
        featureList: [
          "Unos troška za 3 sekunde",
          "Pretplate i fiksni troškovi se knjiže automatski",
          "AI skeniranje računa i razvrstavanje stavki po kategorijama",
          "Dnevni limit: koliko danas još smiješ potrošiti",
          "Rad bez interneta",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="UnitCent, početna">
            <LogoMark size={36} /><Wordmark />
          </Link>
          <a className="btn primary sm" href="#prijava">Javi mi kad izađe</a>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="h-hero">
          <div className="wrap hero-grid">
            <div>
              <div className="label">Danas smiješ</div>
              <div className="hero-number num"><CountUp to={DAILY} /></div>
              <h1 id="h-hero">Znaj koliko smiješ potrošiti. Svaki dan.</h1>
              <div id="prijava" className="hero-form"><Waitlist id="wl-hero" where="hero" /></div>
            </div>
            <PhoneMock />
          </div>
        </section>

        <Equation />

        <section id="skeniranje" className="scan" aria-labelledby="h-scan">
          <div className="wrap">
            <div className="section-head">
              <h2 id="h-scan">Slikaj. Gotovo.</h2>
              <p>Iznos i datum iz fiskalnog QR koda, stavke razvrstava AI.</p>
            </div>
            <ScanStage>
              <div className="scan-grid">
                <div className="receipt" role="img" aria-label="Primjer fiskalnog računa s šest stavki, ukupno 20,65 eura">
                  <div className="c">KONZUM plus d.o.o.</div>
                  <hr />
                  <div className="l" style={{ ["--i" as string]: 0 }}><span>KRUH BIJELI 500G</span><span>1,89</span></div>
                  <div className="l" style={{ ["--i" as string]: 1 }}><span>MLIJEKO 2,8% 1L</span><span>1,29</span></div>
                  <div className="l" style={{ ["--i" as string]: 2 }}><span>JAJA M 10/1</span><span>3,49</span></div>
                  <div className="l" style={{ ["--i" as string]: 3 }}><span>SIR GOUDA 300G</span><span>3,79</span></div>
                  <div className="l" style={{ ["--i" as string]: 4 }}><span>TEKUC.STAKLA 2L</span><span>4,99</span></div>
                  <div className="l" style={{ ["--i" as string]: 5 }}><span>DETERDZENT 1L</span><span>5,20</span></div>
                  <hr />
                  <div className="l"><b>UKUPNO EUR</b><b>20,65</b></div>
                </div>
                <span className="arrow"><Icon name="arrow" size={24} stroke={2} /></span>
                <div className="groups" role="img" aria-label="Razvrstano: Hrana 10,46 €, Auto 4,99 €, Kućanstvo 5,20 €">
                  <div className="group" style={{ ["--i" as string]: 0 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-hrana)" }}><Icon name="cart" size={18} /></span><span>Hrana</span><span>10,46 €</span></div>
                  </div>
                  <div className="group" style={{ ["--i" as string]: 1 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-auto)" }}><Icon name="car" size={18} /></span><span>Auto</span><span>4,99 €</span></div>
                  </div>
                  <div className="group" style={{ ["--i" as string]: 2 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-stan)" }}><Icon name="house" size={18} /></span><span>Kućanstvo</span><span>5,20 €</span></div>
                  </div>
                </div>
              </div>
            </ScanStage>
          </div>
        </section>

        <section className="subs" aria-labelledby="h-subs">
          <div className="wrap">
            <h2 id="h-subs">Upišeš jednom. Knjiže se same.</h2>
          </div>
          <div className="marquee" aria-label="Primjeri pretplata i fiksnih troškova">
            <div className="track">
              {[...SUBS, ...SUBS].map((n, i) => (
                <span className="sub-chip" key={`${n}-${i}`} aria-hidden={i >= SUBS.length ? true : undefined}>
                  <b>{n}</b>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="besplatno-premium" className="section-alt" aria-labelledby="h-plans">
          <div className="wrap">
            <h2 id="h-plans" style={{ marginBottom: 28 }}>Besplatno i Premium</h2>
            <div className="plans">
              <div className="plan">
                <h3>Besplatno</h3>
                <ul>
                  <li><Icon name="check" size={20} stroke={2.2} />Unos, pretplate i dnevni limit bez ograničenja</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Pregled po kategorijama, rad bez interneta</li>
                  <li><Icon name="check" size={20} stroke={2.2} />3 AI skeniranja računa mjesečno</li>
                </ul>
              </div>
              <div className="plan premium">
                <h3>Premium</h3>
                <ul>
                  <li><Icon name="check" size={20} stroke={2.2} />AI skeniranje računa bez ograničenja</li>
                  <li><Icon name="check" size={20} stroke={2.2} />AI uvidi i budžeti po kategoriji</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Uvoz iz Excela i izvoz</li>
                </ul>
              </div>
            </div>
            <p className="plans-note">Cijene objavljujemo uz lansiranje.</p>
          </div>
        </section>

        <section id="pitanja" aria-labelledby="h-faq">
          <div className="wrap faq-grid">
            <div className="section-head">
              <h2 id="h-faq">Pitanja</h2>
            </div>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="prijava-dno" className="cta section-alt" aria-labelledby="h-cta">
          <div className="wrap">
            <h2 id="h-cta">Prestani pogađati. Počni znati.</h2>
            <div className="hero-form center"><Waitlist id="wl-foot" where="footer" /></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} UnitCent</span>
          <nav aria-label="Podnožje">
            <Link href="/privatnost">Privatnost</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Kontakt</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
