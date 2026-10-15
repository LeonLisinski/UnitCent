import Link from "next/link";
import { Icon } from "./icons";
import { LogoMark, Wordmark } from "./Logo";
import { CountUp, ScanStage } from "./Motion";
import { Waitlist } from "./Waitlist";
import { CONTACT_EMAIL, FAQ, SITE_NAME, SITE_URL } from "./site";

/*
 * Jedan plan, isti brojevi svugdje (primanja 1.633 − obavezno 856,33 − štednja 200 = 576,67;
 * potrošeno do jutros 237,40; ostaje 339,27; 17 dana uključujući danas; 339,27 / 17 = 19,96).
 */
const DAILY = 19.96;

function PhoneMock() {
  return (
    <div className="phone-wrap">
      <div className="phone" role="img" aria-label="Početni ekran aplikacije UnitCent: danas smiješ potrošiti 19,96 €, potrošeno 237,40 € od 576,67 € ovaj mjesec, zadnji troškovi">
        <div className="p-top">
          <div><small className="muted">Četvrtak, 15. listopada</small><br /><b>Bok, Leon</b></div>
          <span className="avatar">L</span>
        </div>
        <div className="p-hero">
          <div className="label">Danas smiješ</div>
          <div className="amt num"><CountUp to={DAILY} /></div>
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
      <div className="float-card" role="img" aria-label="Skeniran račun Konzum 20,65 € razvrstan u Hranu, Auto i Cigarete">
        <span className="pill-ai">AI</span>
        <div className="fc-t">Konzum · 20,65 €</div>
        <div className="fc-r"><span style={{ ["--c" as string]: "var(--cat-hrana)" }}>Hrana</span><span style={{ ["--c" as string]: "var(--cat-auto)" }}>Auto</span><span style={{ ["--c" as string]: "var(--cat-cigarete)" }}>Cigarete</span></div>
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
            <LogoMark size={40} /><Wordmark />
          </Link>
          <nav className="nav" aria-label="Glavna navigacija">
            <a className="hide-sm" href="#kako-radi">Kako radi</a>
            <a className="hide-sm" href="#skeniranje">AI skeniranje</a>
            <a className="hide-sm" href="#pitanja">Pitanja</a>
            <a className="btn primary sm" href="#prijava">Prijavi se</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="h-hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">Uskoro na iPhone i Android</span>
              <h1 id="h-hero">Znaj koliko smiješ potrošiti, svaki dan.</h1>
              <p className="lead">Unos za 3 sekunde. AI čita račune. Svaki dan znaš koliko smiješ potrošiti.</p>
              <div id="prijava" className="hero-form"><Waitlist id="wl-hero" where="hero" /></div>
              <ul className="trust" aria-label="Obećanja">
                <li>Bez reklama</li><li>Ne prodajemo podatke</li><li>Brisanje računa u aplikaciji</li>
              </ul>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section className="problem" aria-label="Zašto UnitCent">
          <div className="wrap">
            <p>Excel je naporan. Bankovna aplikacija ti kaže „Konzum 47 €“, ali ne na što si ih potrošio. <b>UnitCent ti kaže i jedno i drugo, za 3 sekunde.</b></p>
          </div>
        </section>

        <section id="kako-radi" className="section-alt" aria-labelledby="h-how">
          <div className="wrap">
            <div className="section-head">
              <span className="label">Kako radi</span>
              <h2 id="h-how">Tri koraka, bez Excela</h2>
            </div>
            <div className="steps">
              <div className="step">
                <span className="ic"><Icon name="plus" size={24} /></span>
                <span className="time">Oko 3 sekunde</span>
                <h3>Unesi</h3>
                <p>Dodirni +, upiši iznos i dodirni kategoriju. Trošak se odmah sprema.</p>
              </div>
              <div className="step">
                <span className="ic"><Icon name="camera" size={24} /></span>
                <span className="time">Bez tipkanja</span>
                <h3>Skeniraj</h3>
                <p>Slikaj račun. AI razvrsta stavke, a iznos i datum uzme iz QR koda.</p>
              </div>
              <div className="step">
                <span className="ic"><Icon name="chart" size={24} /></span>
                <span className="time">Svaki dan</span>
                <h3>Pregledaj</h3>
                <p>Vidiš koliko smiješ potrošiti danas i što te čeka od naplata.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="skeniranje" className="scan" aria-labelledby="h-scan">
          <div className="wrap">
            <div className="section-head">
              <span className="label">AI skeniranje računa</span>
              <h2 id="h-scan">Jedan račun, tri kategorije</h2>
              <p>Kruh ide u Hranu, tekućina za stakla u Auto, a cigarete u Cigarete. Ti samo potvrdiš.</p>
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
                  <div className="l" style={{ ["--i" as string]: 5 }}><span>MARLBORO GOLD</span><span>5,20</span></div>
                  <hr />
                  <div className="l"><b>UKUPNO EUR</b><b>20,65</b></div>
                </div>
                <span className="arrow"><Icon name="arrow" size={24} stroke={2} /></span>
                <div className="groups" role="img" aria-label="Razvrstano: Hrana 10,46 €, Auto 4,99 €, Cigarete 5,20 €">
                  <div className="group" style={{ ["--i" as string]: 0 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-hrana)" }}><Icon name="cart" size={18} /></span><span>Hrana</span><span>10,46 €</span></div>
                    <ul><li>Kruh, mlijeko, jaja, sir</li></ul>
                  </div>
                  <div className="group" style={{ ["--i" as string]: 1 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-auto)" }}><Icon name="car" size={18} /></span><span>Auto</span><span>4,99 €</span></div>
                    <ul><li>Tekućina za stakla 2 L</li></ul>
                  </div>
                  <div className="group" style={{ ["--i" as string]: 2 }}>
                    <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-cigarete)" }}><Icon name="smoke" size={18} /></span><span>Cigarete</span><span>5,20 €</span></div>
                    <ul><li>Marlboro Gold</li></ul>
                  </div>
                </div>
              </div>
            </ScanStage>
            <div className="scan-points">
              <div><b>Iznos iz QR koda</b><p>Ukupni iznos i datum čitaju se iz fiskalnog QR koda.</p></div>
              <div><b>Ti imaš zadnju riječ</b><p>Dodirni stavku i promijeni kategoriju. Ispravke se pamte.</p></div>
              <div><b>Za hrvatske račune</b><p>Razumije skraćene nazive stavki s pravih računa.</p></div>
            </div>
          </div>
        </section>

        <section id="limit" aria-labelledby="h-limit">
          <div className="wrap split">
            <div className="prose">
              <span className="label">Dnevni limit</span>
              <h2 id="h-limit" style={{ marginTop: 14 }}>Ne samo koliko si potrošio, nego koliko još smiješ</h2>
              <p className="muted" style={{ marginTop: 18 }}>
                Upišeš primanja, obavezne troškove i koliko želiš uštedjeti. UnitCent ostatak podijeli s danima do kraja mjeseca.
              </p>
              <p className="muted">
                Pretplate i fiksne troškove (Spotify, Netflix, teretana, najam, kredit, mobitel, režije, RTV pristojba) unosiš jednom. Knjiže se same, a dan prije dobiješ podsjetnik.
              </p>
            </div>
            <div className="calc" role="img" aria-label="Primjer izračuna za 15. listopada: primanja 1.633 €, obavezno 856,33 €, štednja 200 €, ostalo za trošiti 576,67 €, potrošeno 237,40 €, danas smiješ 19,96 €">
              <div className="kv"><span>Primanja</span><b>1.633,00 €</b></div>
              <div className="kv"><span>Obavezno (11 stavki)</span><b>−856,33 €</b></div>
              <div className="kv"><span>Štednja</span><b>−200,00 €</b></div>
              <div className="kv tot"><span>Ostalo za trošiti</span><b>576,67 €</b></div>
              <div className="kv"><span>Potrošeno do danas</span><b>−237,40 €</b></div>
              <div className="kv"><span>Ostaje za 17 dana</span><b>339,27 €</b></div>
              <div className="kv tot lim"><span>Danas smiješ</span><b><CountUp to={DAILY} /></b></div>
            </div>
          </div>
        </section>

        <section id="besplatno-premium" className="section-alt" aria-labelledby="h-plans">
          <div className="wrap">
            <div className="section-head">
              <span className="label">Besplatno i Premium</span>
              <h2 id="h-plans">Ono što koristiš svaki dan ostaje besplatno</h2>
              <p>Ručni unos, pretplate, dnevni limit i pregled nemaju ograničenja. Premium je za one koji žele da AI radi umjesto njih.</p>
            </div>
            <div className="plans">
              <div className="plan">
                <div><h3>Besplatno</h3><p className="muted">Za svakodnevno praćenje</p></div>
                <ul>
                  <li><Icon name="check" size={20} stroke={2.2} />Brzi unos troškova bez ograničenja</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Pretplate, fiksni troškovi i podsjetnici</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Dnevni limit i mjesečni plan</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Pregled po kategorijama, rad bez interneta</li>
                  <li><Icon name="check" size={20} stroke={2.2} />3 AI skeniranja računa mjesečno</li>
                </ul>
              </div>
              <div className="plan premium">
                <span className="tag">Premium</span>
                <div><h3>Za one koji skeniraju</h3><p className="muted">Sve iz besplatnog, uz</p></div>
                <ul>
                  <li><Icon name="check" size={20} stroke={2.2} />AI skeniranje računa bez ograničenja</li>
                  <li><Icon name="check" size={20} stroke={2.2} />AI uvidi i napredna analiza</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Budžeti po kategoriji s upozorenjem</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Uvoz iz Excela, izvoz u Excel ili PDF</li>
                  <li className="soon"><Icon name="check" size={20} stroke={2.2} />Uskoro: pametna shopping lista i zajednički budžet</li>
                </ul>
                <a className="btn primary" href="#prijava">Prijavi se za ponudu</a>
              </div>
            </div>
            <p className="plans-note">Cijene Premiuma objavljujemo uz lansiranje. Besplatni dio ostaje besplatan.</p>
          </div>
        </section>

        <section id="pitanja" aria-labelledby="h-faq">
          <div className="wrap faq-grid">
            <div className="section-head">
              <span className="label">Pitanja</span>
              <h2 id="h-faq">Česta pitanja</h2>
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
            <p>UnitCent je u izradi. Ostavi e-adresu i javit ćemo ti se jednom, kad izađe.</p>
            <div className="hero-form center"><Waitlist id="wl-foot" where="footer" /></div>
            <ul className="trust center" aria-label="Obećanja">
              <li>Bez reklama</li><li>Ne prodajemo podatke</li><li>Brisanje računa u aplikaciji</li>
            </ul>
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
