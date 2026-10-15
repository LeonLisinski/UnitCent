import Link from "next/link";
import { Icon } from "./icons";
import { CONTACT_EMAIL, FAQ, SITE_NAME, SITE_URL } from "./site";

function AppleMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.7zM14 5.3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  );
}
function PlayMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.5 2.7c-.3.3-.5.8-.5 1.4v15.8c0 .6.2 1.1.5 1.4l.1.1 8.9-8.9v-.2L4.6 2.6l-.1.1zM16.5 15.4l-3-3v-.2l3-3 .1.1 3.5 2c1 .6 1 1.500 0 2.100l-3.500 2-.1.1z" />
      <path d="M16.600 15.300 13.500 12.200 4.500 21.200c.3.3.9.4 1.500 0l10.600-5.900" opacity=".7" />
      <path d="M16.600 9.100 6 3c-.6-.4-1.200-.3-1.500 0l9 9 3.100-2.900z" opacity=".85" />
    </svg>
  );
}

function Stores() {
  return (
    <>
      <a className="store" href="#preuzmi" aria-label="App Store, uskoro">
        <AppleMark />
        <span><small>Uskoro na</small><strong>App Store</strong></span>
      </a>
      <a className="store" href="#preuzmi" aria-label="Google Play, uskoro">
        <PlayMark />
        <span><small>Uskoro na</small><strong>Google Play</strong></span>
      </a>
    </>
  );
}

function PhoneMock() {
  return (
    <div className="phone" role="img" aria-label="Početni ekran aplikacije UnitCent: danas smiješ potrošiti 29,08 €, potrošeno 237 € od 570 € ovaj mjesec, zadnji troškovi">
      <div className="p-top">
        <div><small className="muted">Srijeda, 15. listopada</small><br /><b>Bok, Leon</b></div>
        <span className="avatar">L</span>
      </div>
      <div className="p-hero">
        <div className="label">Danas smiješ</div>
        <div className="amt num">29,08 €</div>
        <small>Limit za danas · još 17 dana</small>
      </div>
      <div className="p-card">
        <div className="row"><span className="label" style={{ flex: 1 }}>Ovaj mjesec</span><span style={{ fontWeight: 700, fontSize: 12, color: "var(--brand-ink)", background: "var(--brand-soft)", padding: "2px 8px", borderRadius: 99 }}>Po planu</span></div>
        <div className="row" style={{ justifyContent: "space-between", fontWeight: 700 }}><span className="num">Potrošeno 237,40 €</span><small className="muted num">od 570,00 €</small></div>
        <div className="bar"><i style={{ width: "42%" }} /></div>
      </div>
      <div className="p-card" style={{ gap: 0 }}>
        <div className="row"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-hrana)" }}><Icon name="cart" size={16} /></span><span className="grow">Lidl<small>Danas · Hrana</small></span><span className="amount">−23,60 €</span></div>
        <div className="row"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-auto)" }}><Icon name="car" size={16} /></span><span className="grow">INA gorivo<small>Jučer · Auto</small></span><span className="amount">−82,00 €</span></div>
        <div className="row"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-pretplate)" }}><Icon name="repeat" size={16} /></span><span className="grow">Netflix<small>Sutra naplata</small></span><span className="amount">−6,00 €</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        email: CONTACT_EMAIL,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#site`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "hr",
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "FinanceApplication",
        operatingSystem: "iOS, Android",
        inLanguage: "hr",
        description:
          "Hrvatska aplikacija za praćenje troškova s AI skeniranjem računa, automatskim pretplatama i dnevnim limitom potrošnje.",
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
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="UnitCent, početna">
            <span className="logo-mark" aria-hidden="true">u¢</span>UnitCent
          </Link>
          <nav className="nav" aria-label="Glavna navigacija">
            <a className="hide-sm" href="#kako-radi">Kako radi</a>
            <a className="hide-sm" href="#skeniranje">AI skeniranje</a>
            <a className="hide-sm" href="#besplatno-premium">Besplatno i Premium</a>
            <a className="hide-sm" href="#pitanja">Pitanja</a>
            <a className="btn primary sm" href="#preuzmi">Preuzmi</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="h-hero" style={{ paddingBlock: undefined }}>
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">Aplikacija za troškove, napravljena za Hrvatsku</span>
              <h1 id="h-hero">Znaj koliko smiješ potrošiti, svaki dan.</h1>
              <p className="lead">
                UnitCent bilježi trošak za 3 sekunde, sam knjiži pretplate i AI-jem čita račune. Početni ekran odmah odgovara na jedno pitanje: koliko još smijem danas.
              </p>
              <div className="stores"><Stores /></div>
              <p className="note">Aplikacija je u izradi. Dostupna za iPhone i Android.</p>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section id="kako-radi" className="section-alt" aria-labelledby="h-how">
          <div className="wrap">
            <div className="section-head">
              <span className="label">Kako radi</span>
              <h2 id="h-how">Tri koraka, bez Excela</h2>
              <p>Većina ljudi odustane od praćenja troškova jer je unos spor i dosadan. UnitCent je napravljen da bude brz.</p>
            </div>
            <div className="steps">
              <div className="step">
                <span className="ic"><Icon name="plus" size={24} /></span>
                <span className="time">Oko 3 sekunde</span>
                <h3>Unesi</h3>
                <p>Dodirni +, upiši iznos i dodirni kategoriju. Tipkovnica s brojevima je već otvorena, a trošak se odmah sprema.</p>
              </div>
              <div className="step">
                <span className="ic"><Icon name="camera" size={24} /></span>
                <span className="time">Bez tipkanja</span>
                <h3>Skeniraj</h3>
                <p>Slikaj račun. AI pročita stavke i razvrsta ih u kategorije, a iznos i datum uzme iz QR koda fiskalnog računa.</p>
              </div>
              <div className="step">
                <span className="ic"><Icon name="chart" size={24} /></span>
                <span className="time">Svaki dan</span>
                <h3>Pregledaj</h3>
                <p>Vidiš koliko smiješ potrošiti danas, na što ti ide novac i što te čeka od naplata.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="skeniranje" className="scan" aria-labelledby="h-scan">
          <div className="wrap">
            <div className="section-head">
              <span className="label">AI skeniranje računa</span>
              <h2 id="h-scan">Jedan račun, tri kategorije</h2>
              <p>Kruh ide u Hranu, tekućina za stakla u Auto, a cigarete u Cigarete. Ti samo potvrdiš ili ispraviš.</p>
            </div>
            <div className="scan-grid">
              <div className="receipt" role="img" aria-label="Primjer fiskalnog računa s šest stavki, ukupno 20,65 eura">
                <div className="c">KONZUM plus d.o.o.</div>
                <hr />
                <div className="l"><span>KRUH BIJELI 500G</span><span>1,89</span></div>
                <div className="l"><span>MLIJEKO 2,8% 1L</span><span>1,29</span></div>
                <div className="l"><span>JAJA M 10/1</span><span>3,49</span></div>
                <div className="l"><span>SIR GOUDA 300G</span><span>3,79</span></div>
                <div className="l"><span>TEKUC.STAKLA 2L</span><span>4,99</span></div>
                <div className="l"><span>MARLBORO GOLD</span><span>5,20</span></div>
                <hr />
                <div className="l"><b>UKUPNO EUR</b><b>20,65</b></div>
              </div>
              <span className="arrow"><Icon name="arrow" size={24} stroke={2} /></span>
              <div className="groups" role="img" aria-label="Razvrstano: Hrana 10,46 €, Auto 4,99 €, Cigarete 5,20 €">
                <div className="group">
                  <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-hrana)" }}><Icon name="cart" size={18} /></span><span>Hrana</span><span>10,46 €</span></div>
                  <ul><li>Kruh bijeli 500 g</li><li>Mlijeko 2,8 % 1 L</li><li>Jaja M 10 kom</li><li>Sir gouda 300 g</li></ul>
                </div>
                <div className="group">
                  <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-auto)" }}><Icon name="car" size={18} /></span><span>Auto</span><span>4,99 €</span></div>
                  <ul><li>Tekućina za stakla 2 L</li></ul>
                </div>
                <div className="group">
                  <div className="gh"><span className="cat-dot" style={{ ["--c" as string]: "var(--cat-cigarete)" }}><Icon name="smoke" size={18} /></span><span>Cigarete</span><span>5,20 €</span></div>
                  <ul><li>Marlboro Gold</li></ul>
                </div>
              </div>
            </div>
            <div className="scan-points">
              <div><b>Iznos iz QR koda</b><p>Ukupni iznos i datum čitaju se iz fiskalnog QR koda, pa nema pogrešnog čitanja brojeva.</p></div>
              <div><b>Ti imaš zadnju riječ</b><p>Dodirni stavku i promijeni kategoriju. Ispravke se pamte za sljedeći put.</p></div>
              <div><b>Za hrvatske račune</b><p>Razumije skraćene nazive stavki i trgovine kakve stvarno nalaziš na računima.</p></div>
            </div>
          </div>
        </section>

        <section id="limit" aria-labelledby="h-limit">
          <div className="wrap split">
            <div className="prose">
              <span className="label">Dnevni limit</span>
              <h2 id="h-limit" style={{ marginTop: 14 }}>Ne samo koliko si potrošio, nego koliko još smiješ</h2>
              <p className="muted" style={{ marginTop: 18 }}>
                Upišeš primanja, obavezne troškove i koliko želiš uštedjeti. UnitCent iz toga izračuna iznos koji ti ostaje i podijeli ga s danima do kraja mjeseca.
              </p>
              <p className="muted">
                Pretplate i fiksni troškovi (Spotify, Netflix, teretana, najam, kredit, mobitel, režije, RTV pristojba) unosiš jednom. Knjiže se same, a dan prije dobiješ podsjetnik.
              </p>
            </div>
            <div className="calc" role="img" aria-label="Primjer izračuna: primanja 1.633 €, obavezno 856,33 €, štednja 200 €, ostalo za trošiti 576,67 €">
              <div className="kv"><span>Primanja</span><b>1.633,00 €</b></div>
              <div className="kv"><span>Obavezno (11 stavki)</span><b>−856,33 €</b></div>
              <div className="kv"><span>Štednja</span><b>−200,00 €</b></div>
              <div className="kv tot"><span>Ostalo za trošiti</span><b>576,67 €</b></div>
              <div className="kv tot lim"><span>Danas smiješ</span><b>29,08 €</b></div>
            </div>
          </div>
        </section>

        <section className="section-alt" aria-labelledby="h-feat">
          <div className="wrap">
            <div className="section-head">
              <span className="label">Što još dobiješ</span>
              <h2 id="h-feat">Sve što treba, ništa viška</h2>
            </div>
            <div className="features">
              <div className="feature"><span className="ic"><Icon name="repeat" /></span><h3>Pretplate same sebe knjiže</h3><p>Kalendar naplata i podsjetnik dan prije: „Sutra ti skida Netflix.“</p></div>
              <div className="feature"><span className="ic"><Icon name="tag" /></span><h3>Kategorije po tvom</h3><p>Dobre zadane kategorije s ikonama i bojama koje možeš mijenjati.</p></div>
              <div className="feature"><span className="ic"><Icon name="chart" /></span><h3>Jasan pregled</h3><p>Potrošnja po kategorijama i usporedba s prošlim mjesecom, bez pretrpanih grafova.</p></div>
              <div className="feature"><span className="ic"><Icon name="wifi" /></span><h3>Radi bez interneta</h3><p>Unos je trenutan, a sinkronizacija ide u pozadini kad si na mreži.</p></div>
              <div className="feature"><span className="ic"><Icon name="target" /></span><h3>Budžeti s upozorenjem</h3><p>Postavi limit za kategoriju i javimo ti kad mu se približiš.</p></div>
              <div className="feature"><span className="ic"><Icon name="file" /></span><h3>Tvoj Excel dolazi s tobom</h3><p>Uvoz postojećeg troškovnika i izvoz u Excel ili PDF.</p></div>
            </div>
          </div>
        </section>

        <section id="besplatno-premium" aria-labelledby="h-plans">
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
                  <li><Icon name="check" size={20} stroke={2.2} />Pregled po kategorijama</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Nekoliko AI skeniranja mjesečno</li>
                </ul>
              </div>
              <div className="plan premium">
                <span className="tag">Premium</span>
                <div><h3>Za one koji skeniraju</h3><p className="muted">Sve iz besplatnog, uz</p></div>
                <ul>
                  <li><Icon name="check" size={20} stroke={2.2} />AI skeniranje računa bez ograničenja</li>
                  <li><Icon name="check" size={20} stroke={2.2} />AI uvidi i napredna analiza</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Budžeti po kategoriji s upozorenjem</li>
                  <li><Icon name="check" size={20} stroke={2.2} />Uvoz iz Excela i izvoz u Excel ili PDF</li>
                  <li className="soon"><Icon name="check" size={20} stroke={2.2} />Uskoro: pametna shopping lista i zajednički budžet</li>
                </ul>
              </div>
            </div>
            <p className="plans-note">Cijene Premiuma objavljujemo uz lansiranje. Besplatni dio ostaje besplatan.</p>
          </div>
        </section>

        <section id="pitanja" className="section-alt" aria-labelledby="h-faq">
          <div className="wrap">
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

        <section id="preuzmi" className="cta" aria-labelledby="h-cta">
          <div className="wrap">
            <h2 id="h-cta">Prestani pogađati. Počni znati.</h2>
            <p>UnitCent je u izradi za iPhone i Android. Kad bude spreman za testiranje, bit će ovdje.</p>
            <div className="stores"><Stores /></div>
            <p style={{ fontSize: 15 }}>Za pitanja i prijedloge piši na <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
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
