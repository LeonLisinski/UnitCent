"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { Words } from "./Words";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nf = new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type CatKey = "hrana" | "auto" | "kuca";
const CATS: Record<CatKey, { name: string; icon: string; color: string }> = {
  hrana: { name: "Hrana", icon: "cart", color: "#4cc38a" },
  auto: { name: "Auto", icon: "car", color: "#6ea2f5" },
  kuca: { name: "Kućanstvo", icon: "house", color: "#b195f0" },
};

/* Isti račun kao svugdje: 6 stavki, ukupno 20,65 € (Hrana 10,46, Auto 4,99, Kućanstvo 5,20). */
const ITEMS: { raw: string; name: string; amt: number; cat: CatKey }[] = [
  { raw: "KRUH BIJELI 500G", name: "Kruh bijeli 500 g", amt: 1.89, cat: "hrana" },
  { raw: "MLIJEKO 2,8% 1L", name: "Mlijeko 2,8 % 1 L", amt: 1.29, cat: "hrana" },
  { raw: "JAJA M 10/1", name: "Jaja M 10 kom", amt: 3.49, cat: "hrana" },
  { raw: "SIR GOUDA 300G", name: "Sir gouda 300 g", amt: 3.79, cat: "hrana" },
  { raw: "TEKUC.STAKLA 2L", name: "Tekućina za stakla 2 L", amt: 4.99, cat: "auto" },
  { raw: "DETERDZENT 1L", name: "Deterdžent 1 L", amt: 5.2, cat: "kuca" },
];

/**
 * „Slikaj. Gotovo.”: lijevo mobitel s kamerom koja skenira račun, desno popis stavki po kategorijama.
 * Dok skrolaš (prikovano na desktopu) linija skenera prolazi računom i stavke jedna po jedna
 * "prelaze" u svoje kategorije. Bez JS-a ili uz smanjeni pokret sve je odmah razvrstano.
 */
export function ScanPinned() {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(ITEMS.length);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    setLive(true);
    setN(0);
    let raf = 0;
    const update = () => {
      raf = 0;
      let p: number;
      if (window.matchMedia("(max-width: 860px)").matches) {
        const g = el.querySelector<HTMLElement>(".sp-flow");
        if (!g) return;
        const r = g.getBoundingClientRect();
        p = (window.innerHeight * 0.78 - r.top) / (r.height * 0.8);
      } else {
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        p = total > 0 ? -r.top / total : 1;
      }
      p = Math.min(1, Math.max(0, p));
      setN(Math.min(ITEMS.length, Math.round((p / 0.85) * ITEMS.length)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const sums: Record<CatKey, number> = { hrana: 0, auto: 0, kuca: 0 };
  ITEMS.forEach((it, i) => { if (i < n) sums[it.cat] += it.amt; });
  const total = ITEMS.reduce((s, i) => s + i.amt, 0);
  const scanning = live && n < ITEMS.length;
  // linija skenera: prolazi redcima računa
  const linePct = Math.min(100, (n / ITEMS.length) * 100);

  return (
    <section ref={ref} id="skeniranje" className={`scanpin${live ? " live" : ""}`} aria-labelledby="h-scan">
      <div className="sp-sticky">
        <div className="sp-panel">
          <div className="wrap">
            <div className="sp-head" data-reveal>
              <span className="label">03 / Skeniranje</span>
              <h2 id="h-scan"><Words text="Slikaj." /> <em className="serif"><Words text="Gotovo." /></em></h2>
              <p>Iznos i datum iz fiskalnog QR koda. Stavke razvrstava AI, a ti samo potvrdiš.</p>
            </div>

            <div className="sp-flow">
              {/* 1: mobitel slika račun */}
              <div className="sp-col">
                <div className="sp-step"><b>1</b>Slikaš račun</div>
                <div className="sp-phone" role="img" aria-label="Mobitel skenira račun trgovine Konzum sa šest stavki, ukupno 20,65 eura">
                  <div className="sp-cam">
                    <span className="sp-corner tl" /><span className="sp-corner tr" /><span className="sp-corner bl" /><span className="sp-corner br" />
                    <div className="sp-paper">
                      <div className="sp-t">KONZUM plus d.o.o.</div>
                      <div className="sp-hr" />
                      {ITEMS.map((it, i) => (
                        <div className={`sp-ri${i < n ? " on" : ""}`} key={it.raw} style={{ ["--c" as string]: CATS[it.cat].color }}>
                          <span>{it.raw}</span>
                          <span className="num">{nf.format(it.amt)}</span>
                        </div>
                      ))}
                      <div className="sp-hr" />
                      <div className="sp-total"><span>UKUPNO EUR</span><span className="num">{nf.format(total)}</span></div>
                    </div>
                    {scanning && <span className="sp-line" style={{ top: `${14 + linePct * 0.62}%` }} />}
                  </div>
                  <div className="sp-shutter" aria-hidden="true"><i /></div>
                </div>
              </div>

              <span className="sp-arrow" aria-hidden="true"><Icon name="arrow" size={28} stroke={2.2} /></span>

              {/* 2: stavke po kategorijama */}
              <div className="sp-col">
                <div className="sp-step"><b>2</b>Stavke se razvrstaju same</div>
                <div className="sp-list">
                  {(Object.keys(CATS) as CatKey[]).map((k) => (
                    <div className={`sp-cat${sums[k] > 0 ? " on" : ""}`} key={k} style={{ ["--c" as string]: CATS[k].color }}>
                      <div className="sp-cat-h">
                        <span className="sp-ic"><Icon name={CATS[k].icon} size={20} stroke={1.8} /></span>
                        <span className="sp-n">{CATS[k].name}</span>
                        <span className="sp-a num">{nf.format(sums[k])} €</span>
                      </div>
                      <ul>
                        {ITEMS.map((it, i) =>
                          it.cat === k ? (
                            <li key={it.raw} className={i < n ? "on" : ""}>
                              <span>{it.name}</span>
                              <span className="num">{nf.format(it.amt)} €</span>
                            </li>
                          ) : null,
                        )}
                      </ul>
                    </div>
                  ))}
                  <div className="sp-ai"><b>AI</b>Dodirni stavku da promijeniš kategoriju. Ispravke se pamte.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
