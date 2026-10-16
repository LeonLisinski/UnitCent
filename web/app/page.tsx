import Link from "next/link";
import { Icon } from "./icons";
import { LogoMark, Wordmark } from "./Logo";
import { CountUp, Equation, HeaderCta, PhoneTilt, Reveal, ScrollRing } from "./Motion";
import { ScanPinned } from "./ScanPinned";
import { Stores } from "./Stores";
import { TryIt } from "./TryIt";
import { Words } from "./Words";
import { Waitlist } from "./Waitlist";
import { CONTACT_EMAIL, FAQ, SITE_NAME, SITE_URL } from "./site";

/*
 * Jedan plan, isti brojevi svugdje (primanja 1.468 − obavezno 771,33 − štednja 150 = 546,67;
 * potrošeno do jutros 207,40; ostaje 339,27; 17 dana uključujući danas; 339,27 / 17 = 19,96).
 * Isto je u Motion.tsx (jednadžba). Tekst CTA-a je svugdje isti.
 */
const DAILY = 19.96;

/* Primjeri fiksnih troškova i dan u mjesecu kad se sami knjiže (ilustracija, bez iznosa). */
const SUBS: { n: string; d: number; c: string; i: string }[] = [
  { n: "Najam", d: 1, c: "--cat-stan", i: "house" },
  { n: "Kredit", d: 3, c: "--cat-stan", i: "card" },
  { n: "Spotify", d: 5, c: "--cat-pretplate", i: "music" },
  { n: "Režije", d: 8, c: "--cat-stan", i: "drop" },
  { n: "Netflix", d: 11, c: "--cat-pretplate", i: "play" },
  { n: "Teretana", d: 12, c: "--cat-zdravlje", i: "dumbbell" },
  { n: "Mobitel", d: 15, c: "--cat-pretplate", i: "phone" },
  { n: "Struja", d: 18, c: "--cat-stan", i: "bolt" },
  { n: "HBO Max", d: 21, c: "--cat-pretplate", i: "play" },
  { n: "iCloud", d: 24, c: "--cat-pretplate", i: "cloud" },
  { n: "Osiguranje", d: 28, c: "--cat-auto", i: "shield" },
];

function PhoneMock() {
  return (
    <div className="phone-wrap">
      <span className="float-chip fc1" aria-hidden="true"><Icon name="bell" size={16} stroke={2} /><span><b>Sutra naplata</b><small>Netflix · −6,00 €</small></span></span>
      <span className="float-chip fc2" aria-hidden="true"><Icon name="check" size={16} stroke={2.4} /><span><b>Račun razvrstan</b><small>Hrana · Auto · Kućanstvo</small></span></span>
      <div className="phone" role="img" aria-label="Početni ekran aplikacije UnitCent: preporučeni dnevni trošak 19,96 €, potrošeno 207,40 € od 546,67 € ovaj mjesec">
        <div className="p-top">
          <div><small className="muted">Četvrtak, 15. listopada</small><br /><b>Bok, Luka</b></div>
          <span className="avatar">L</span>
        </div>
        <div className="p-hero">
          <div className="label">Preporučeni dnevni trošak</div>
          <div className="amt num">19,96 €</div>
          <small>Još 17 dana u mjesecu</small>
        </div>
        <div className="p-card">
          <div className="row"><span className="label" style={{ flex: 1 }}>Ovaj mjesec</span><span className="p-pill">Po planu</span></div>
          <div className="row" style={{ justifyContent: "space-between", fontWeight: 700 }}><span className="num">Potrošeno 207,40 €</span><small className="muted num">od 546,67 €</small></div>
          <div className="bar"><i style={{ width: "38%" }} /></div>
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
            <LogoMark size={30} draw /><Wordmark />
          </Link>
          <div className="header-actions">
            <HeaderCta />
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="h-hero">
          <svg className="deco-ring" viewBox="0 0 100 100" fill="none" strokeLinecap="round" aria-hidden="true"><path d="M74.04 25.96A34 34 0 1 0 74.04 74.04" stroke="var(--brand)" strokeWidth="16" /></svg>
          <div className="wrap hero-grid">
            <div>
              <div className="label">Preporučeni dnevni trošak</div>
              <div className="hero-number num"><CountUp to={DAILY} /></div>
              <h1 id="h-hero">Znaj koliko smiješ potrošiti. <em className="serif">Svaki dan.</em></h1>
              <div id="prijava" className="hero-form"><Waitlist id="wl-hero" where="hero" /></div>
              <Stores className="hero-stores" />
              <div className="meta-row"><span>iPhone + Android</span><span>Fiskalni QR</span><span>Bez reklama</span></div>
            </div>
            <PhoneTilt><PhoneMock /></PhoneTilt>
          </div>
        </section>

        <Equation />

        <TryIt />

        <ScanPinned />

        <section className="subs" aria-labelledby="h-subs">
          <div className="wrap subs-grid">
            <div className="section-head" data-reveal>
              <span className="label">04 / Pretplate</span>
              <h2 id="h-subs"><Words text="Upišeš jednom." /> <em className="serif"><Words text="Knjiže se same." /></em></h2>
              <p>Najam, režije i pretplate svaki mjesec na isti dan, bez tvog unosa. Dan prije stiže podsjetnik, a dnevni limit ih već uračunava.</p>
            </div>
            <div className="mcal" data-reveal role="img" aria-label="Kalendar naplata za listopad 2026: najam 1., kredit 3., Spotify 5., režije 8., Netflix 11., teretana 12., mobitel 15., struja 18., HBO Max 21., iCloud 24., osiguranje 28.">
              <div className="mcal-grid" aria-hidden="true">
                {["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"].map((w) => <span className="wd" key={w}>{w}</span>)}
                {[28, 29, 30].map((d) => (
                  <span className="d out" key={`p${d}`}><span className="n num">{d}</span></span>
                ))}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const subs = SUBS.filter((x) => x.d === day);
                  return (
                    <span className={`d${day < 15 ? " past" : ""}${day === 15 ? " today" : ""}${subs.length ? " has" : ""}`} key={day}>
                      <span className="n num">{day}</span>
                      <span className="bs">
                        {subs.map((x, k) => (
                          <span className="sub" key={x.n} data-reveal style={{ ["--c" as string]: `var(${x.c})`, ["--d" as string]: `${200 + (day + k) * 35}ms` }}>
                            <span className="b"><Icon name={x.i} size={20} stroke={1.9} /></span>
                            <span className="sl">{x.n}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                  );
                })}
                <span className="d out" key="n1"><span className="n num">1</span></span>
              </div>
              <div className="mcal-next" aria-hidden="true">
                <span className="dot" />Danas, 15.: Mobitel. Sljedeća: Struja 18.
              </div>
            </div>
          </div>
        </section>

        <section id="besplatno-premium" aria-labelledby="h-plans">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <span className="label">05 / Planovi</span>
              <h2 id="h-plans"><Words text="Besplatno i" /> <em className="serif"><Words text="Premium" /></em></h2>
              <p>Sve što treba za praćenje troškova je besplatno i bez ograničenja. Premium dodaje AI.</p>
            </div>
            <div className="vs-wrap" data-reveal>
              <table className="vs">
                <caption className="sr-only">Usporedba planova Besplatno i Premium</caption>
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">Funkcija</span></th>
                    <th scope="col">Besplatno<small>0 €</small></th>
                    <th scope="col" className="vs-pro">Premium<small>Cijena uz lansiranje</small></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Unos troška za 3 sekunde</th>
                    <td><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Besplatno: da</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">Pretplate i fiksni troškovi</th>
                    <td><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Besplatno: da</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">Dnevni limit i pregled po kategorijama</th>
                    <td><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Besplatno: da</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">Rad bez interneta</th>
                    <td><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Besplatno: da</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">AI skeniranje računa</th>
                    <td><span className="vs-txt">3 mjesečno</span></td>
                    <td className="vs-pro"><span className="vs-txt">Bez ograničenja</span></td>
                  </tr>
                  <tr>
                    <th scope="row">AI uvidi o potrošnji</th>
                    <td><span className="vs-no"><Icon name="x" size={20} stroke={2.2} /><span className="sr-only">Besplatno: ne</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">Budžeti po kategoriji</th>
                    <td><span className="vs-no"><Icon name="x" size={20} stroke={2.2} /><span className="sr-only">Besplatno: ne</span></span></td>
                    <td className="vs-pro"><span className="vs-yes"><Icon name="check" size={22} stroke={2.6} /><span className="sr-only">Premium: da</span></span></td>
                  </tr>
                  <tr>
                    <th scope="row">Povijest pregleda</th>
                    <td><span className="vs-txt">6 mjeseci</span></td>
                    <td className="vs-pro"><span className="vs-txt">Cijela</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="pitanja" aria-labelledby="h-faq">
          <div className="wrap faq-center">
            <div className="section-head" data-reveal>
              <span className="label">06 / Pitanja</span>
              <h2 id="h-faq"><Words text="Pitanja" /></h2>
            </div>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q} name="faq">
                  <summary>{f.q}</summary>
                  <p className="a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="prijava-dno" className="cta" aria-labelledby="h-cta">
          <div className="wrap-full">
            <h2 id="h-cta" data-reveal>Prestani pogađati.<br /><em className="serif">Počni znati.</em></h2>
            <div className="hero-form center"><Waitlist id="wl-foot" where="footer" /></div>
            <Stores className="cta-stores" />
          </div>
        </section>
      </main>

      <ScrollRing />
      <Reveal />

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} UnitCent</span>
          <nav aria-label="Podnožje">
            <Link href="/privatnost">Privatnost</Link>
            <Link href="/uvjeti">Uvjeti</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Kontakt</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
