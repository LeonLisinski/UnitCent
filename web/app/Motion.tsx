"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { RING_ARC } from "./Logo";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nf = new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Odbroji iznos od 0 do `to` kad uđe u vidljivo područje. Bez JS-a ili uz smanjeni pokret odmah prikaže konačni iznos. */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    setVal(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / 1100);
          setVal(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref} className={className} aria-label={`${nf.format(to)} €`}>
      <span aria-hidden="true">{nf.format(val)}&nbsp;€</span>
    </span>
  );
}

/** Pokrene CSS animaciju (račun se ispisuje, stavke lete u kategorije) jednom, kad sekcija uđe u ekran. */
export function ScanStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) el.classList.add("soft");
    el.classList.add("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        requestAnimationFrame(() => el.classList.add("play"));
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} className="scan-stage">{children}</div>;
}

/**
 * Elementi s `data-reveal` lagano izranjaju kad uđu u ekran (`--d` = kašnjenje u ms za niz).
 * Bez JS-a ili uz smanjeni pokret sve je odmah vidljivo: skrivanje se pali tek kad ova komponenta postavi `reveal-on`.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    // Smanji pokret: bez pomaka, ali sekcije se i dalje nježno pojavljuju (samo prozirnost).
    if (reduced()) root.classList.add("reveal-soft");
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    // Što je već u ekranu pri učitavanju ne skriva se (nema treptanja iznad pregiba).
    for (const el of els) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add("in");
      else io.observe(el);
    }
    root.classList.add("reveal-on");
    return () => io.disconnect();
  }, []);
  return null;
}

/**
 * Prsten napretka: koliko je stranice prijeđeno. Isti oblik kao znak UnitCent — prsten se puni dok skrolaš.
 * Pojavi se nakon prvog ekrana; klik vraća na vrh.
 */
export function ScrollRing() {
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);

  // Uz podnožje se sakrije da ne prekriva poveznice (Privatnost, Kontakt).
  useEffect(() => {
    const f = document.querySelector("footer");
    if (!f) return;
    const io = new IntersectionObserver(([e]) => setNearFooter(e.isIntersecting), { threshold: 0 });
    io.observe(f);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setP(max > 0 ? Math.min(1, y / max) : 0);
      setShow(y > window.innerHeight * 0.6);
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

  const pct = Math.round(p * 100);

  return (
    <button
      type="button"
      className={`scroll-ring${show && !nearFooter ? " show" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" })}
      aria-label={`Natrag na vrh. Pročitano ${pct} % stranice.`}
      tabIndex={show && !nearFooter ? 0 : -1}
    >
      <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round" aria-hidden="true">
        {/* oblik logotipa: otvoreni prsten (RING_ARC); prazan trag + ispuna koja ga dopunjuje do cijelog znaka */}
        <path d={RING_ARC} stroke="var(--brand)" strokeOpacity="0.22" strokeWidth="14" />
        <path
          d={RING_ARC} stroke="var(--brand)" strokeWidth="14" pathLength={100}
          strokeDasharray={`${Math.max(0.5, pct)} 100`}
        />
      </svg>
      <span className="scroll-ring-ic"><Icon name="arrowUp" size={18} stroke={2.2} /></span>
    </button>
  );
}

/* Jedan plan, isti brojevi kao u page.tsx: 1.468 − 771,33 − 150 − 207,40 = 339,27; ÷ 17 = 19,96. */
type EqRow = { op: string; label: string; val: string; v: number; hint: string; final?: boolean };
const EQ_ROWS: EqRow[] = [
  { op: "+", label: "Primanja", val: "1.468,00 €", v: 1468, hint: "Primanja" },
  { op: "−", label: "Obavezno, 11 stavki", val: "771,33 €", v: 696.67, hint: "Nakon obaveznog" },
  { op: "−", label: "Štednja", val: "150,00 €", v: 546.67, hint: "Za trošenje" },
  { op: "−", label: "Potrošeno do danas", val: "207,40 €", v: 339.27, hint: "Ostaje ovaj mjesec" },
  { op: "÷", label: "Dana do kraja mjeseca", val: "17", v: 19.96, hint: "Po danu" },
  { op: "=", label: "Dnevni budžet", val: "19,96 €", v: 19.96, hint: "Dnevni budžet", final: true },
];
const RING_FULL = 238.76; // opseg kruga r=38
const RING_END = 59.69; // prsten se zatvara do 3/4 kruga

/**
 * „Odakle taj broj?”: prsten s brojem lijevo, pet redaka desno. Dok skrolaš (prikovano na desktopu)
 * redci se pale jedan po jedan, a broj u prstenu prati zadnji upaljeni redak.
 * Bez JS-a ili uz smanjeni pokret svi su redci upaljeni i prikazuje se konačni broj.
 */
export function Equation() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(EQ_ROWS.length - 1);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    setLive(true);
    setActive(0);
    let raf = 0;
    const update = () => {
      raf = 0;
      let p: number;
      if (window.matchMedia("(max-width: 860px)").matches) {
        const list = el.querySelector<HTMLElement>(".eqv-rows");
        if (!list) return;
        const r = list.getBoundingClientRect();
        p = (window.innerHeight * 0.8 - r.top) / (r.height * 0.9);
      } else {
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        p = total > 0 ? -r.top / total : 1;
      }
      p = Math.min(1, Math.max(0, p));
      setActive(Math.min(EQ_ROWS.length - 1, Math.floor((p / 0.9) * EQ_ROWS.length)));
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

  const cur = EQ_ROWS[active];
  const offset = RING_FULL - (RING_FULL - RING_END) * ((active + 1) / EQ_ROWS.length);

  return (
    <section ref={ref} id="odakle" className={`eqv${live ? " live" : ""}`} aria-labelledby="h-eq">
      <div className="eqv-sticky">
        <div className="wrap eqv-grid">
          <div className="eqv-ring" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round">
              <circle cx="50" cy="50" r="38" stroke="var(--brand)" strokeOpacity="0.14" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="38" stroke="var(--brand)" strokeWidth="12"
                strokeDasharray={RING_FULL} strokeDashoffset={offset} transform="rotate(45 50 50)"
                style={{ transition: "stroke-dashoffset 500ms cubic-bezier(.2,.8,.2,1)" }}
              />
            </svg>
            <div className="eqv-c">
              <span className="label">{cur.hint}</span>
              <b className="num">{nf.format(cur.v)}&nbsp;€</b>
            </div>
          </div>
          <div className="eqv-text">
            <span className="label">01 / Odakle taj broj</span>
            <h2 id="h-eq">Pet redaka. <em className="serif">Bez Excela.</em></h2>
            <ol className="eqv-rows">
              {EQ_ROWS.map((r, i) => (
                <li key={r.label} className={`${i <= active ? "on" : ""}${r.final ? " final" : ""}`}>
                  <span className="op" aria-hidden="true">{r.op}</span>
                  <span className="lbl">{r.label}</span>
                  <b className="val num">{r.val}</b>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Telefon se lagano nagne u 3D-u dok skrolaš prvi ekran. Uz smanjeni pokret ostaje ravan.
 */
export function PhoneTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      el.style.setProperty("--ry", `${(-9 + p * 13).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(3 - p * 5).toFixed(2)}deg`);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="tilt">{children}</div>;
}


/**
 * Gumb u zaglavlju: vidljiv je samo kad nije vidljiva ni forma u heroju ni forma na dnu stranice
 * (da se isti poziv ne prikazuje dvaput). Prostor u zaglavlju ostaje, pa se ništa ne pomiče.
 */
export function HeaderCta() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const els = ["#prijava", "#prijava-dno .hero-form"]
      .map((q) => document.querySelector(q))
      .filter((e): e is Element => !!e);
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = 64; // visina zaglavlja
      const vh = window.innerHeight;
      const anyVisible = els.some((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > top && r.top < vh;
      });
      setHidden(anyVisible);
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

  return (
    <a
      className={`btn primary sm hdr-cta${hidden ? " hide" : ""}`}
      href="#prijava"
      aria-hidden={hidden ? true : undefined}
      tabIndex={hidden ? -1 : 0}
    >
      Javi mi kad izađe
    </a>
  );
}
