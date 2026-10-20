"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { RING_ARC } from "./Logo";

const LIMIT = 19.96; // isti dnevni budžet kao u heroju i jednadžbi
const nf = new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur = (v: number) => `${nf.format(Math.abs(v))} €`;

const CHIPS: { n: string; a: number; icon: string }[] = [
  { n: "Kava", a: 1.8, icon: "cup" },
  { n: "Ručak", a: 9.5, icon: "cart" },
  { n: "Gorivo", a: 40, icon: "fuel" },
];

/**
 * „Isprobaj”: dodaj trošak i gledaj koliko ti ostaje za danas. Ton je isti kao u aplikaciji:
 * kratke činjenice. Prsten je isti oblik kao logotip i puni se kako trošiš.
 */
export function TryIt() {
  const [spent, setSpent] = useState(0);
  const left = LIMIT - spent;
  const used = Math.min(100, Math.max(0, (spent / LIMIT) * 100));
  const state: "ok" | "warn" | "over" = left < 0 ? "over" : left < LIMIT * 0.2 ? "warn" : "ok";

  const msg =
    spent === 0
      ? "Još ništa danas. Lijep dan."
      : state === "ok"
        ? "I dalje si u budžetu."
        : state === "warn"
          ? `Pazi, ostalo je još samo ${eur(left)}.`
          : `Preko za ${eur(left)}. Ništa strašno, sutra se budžet preračuna.`;

  return (
    <section id="isprobaj" className="tryit" aria-labelledby="h-try">
      <div className="wrap tryit-inner" data-reveal>
        <span className="label">02 / Isprobaj</span>
        <h2 id="h-try">Kupio si kavu. <em className="serif">I?</em></h2>

        <div className={`try-stage ${state}`}>
          <div className="try-ring" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round">
              <path d={RING_ARC} stroke="currentColor" strokeOpacity="0.16" strokeWidth="9" />
              <path
                d={RING_ARC} stroke="currentColor" strokeWidth="9" pathLength={100}
                strokeDasharray={`${Math.max(0.5, used)} 100`}
                style={{ transition: "stroke-dasharray 500ms cubic-bezier(.2,.8,.2,1)" }}
              />
            </svg>
            <div className="try-c">
              <span className="label">{left < 0 ? "Danas preko" : "Ostalo za danas"}</span>
              <b className="num" aria-live="polite">{left < 0 ? "−" : ""}{eur(left)}</b>
            </div>
          </div>
        </div>

        <p className="try-msg" aria-live="polite">{msg}</p>

        <div className="try-chips" role="group" aria-label="Dodaj trošak">
          {CHIPS.map((c) => (
            <button type="button" className="try-chip" key={c.n} onClick={() => setSpent((s) => s + c.a)}>
              <Icon name={c.icon} size={18} stroke={1.9} />
              <span>{c.n}</span>
              <b className="num">{eur(c.a)}</b>
            </button>
          ))}
          <button type="button" className="try-reset" onClick={() => setSpent(0)} disabled={spent === 0}>Počni ispočetka</button>
        </div>
      </div>
    </section>
  );
}
