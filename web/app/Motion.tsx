"use client";

import { useEffect, useRef, useState } from "react";

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
    if (!el || reduced()) return;
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

type Line = { op: string; label: string; val: string; kind?: "sum" | "final" };
const LINES: Line[] = [
  { op: "", label: "Primanja", val: "1.633,00 €" },
  { op: "−", label: "Obavezno, 11 stavki", val: "856,33 €" },
  { op: "−", label: "Štednja", val: "200,00 €" },
  { op: "=", label: "Ostalo za trošiti", val: "576,67 €", kind: "sum" },
  { op: "−", label: "Potrošeno do danas", val: "237,40 €" },
  { op: "=", label: "Ostaje", val: "339,27 €", kind: "sum" },
  { op: "÷", label: "Dana do kraja mjeseca", val: "17" },
  { op: "=", label: "Danas smiješ", val: "19,96 €", kind: "final" },
];

/** Jednadžba se gradi dok skrolaš. Bez JS-a ili uz smanjeni pokret svi su retci odmah vidljivi. */
export function Equation() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(LINES.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    setShown(0);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      setShown(Math.min(LINES.length, Math.ceil((p / 0.85) * LINES.length)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={ref} id="odakle" className="eq" aria-labelledby="h-eq">
      <div className="eq-sticky">
        <div className="wrap eq-inner">
          <div>
            <span className="label">Dnevni limit</span>
            <h2 id="h-eq">Odakle taj broj?</h2>
            <p className="eq-sub">Ostatak mjeseca podijeljen s danima koji su ostali.</p>
          </div>
          <ol className="eq-list">
            {LINES.map((l, i) => (
              <li key={l.label} className={`${i < shown ? "on" : ""} ${l.kind ?? ""}`}>
                <span className="op" aria-hidden="true">{l.op}</span>
                <span className="lbl">{l.label}</span>
                <b className="val num">{l.val}</b>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
