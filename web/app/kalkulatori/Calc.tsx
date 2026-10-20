"use client";

import { useId, useState, type ReactNode } from "react";
import type { CalcSlug } from "./data";

/* Kalkulatori rade samo u pregledniku: ništa se ne šalje ni ne sprema. Iznosi su u eurima, hrvatski zapis. */

const nf2 = new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur = (v: number) => `${nf2.format(v)} €`;

/** „1.468,00“, „1468,5“, „12.5“ → broj. Zarez je decimalni; točka je tisućica, osim kad iza nje stoje 1 do 2 znamenke. */
export function parseHr(input: string): number | null {
  const s = input.replace(/\s|€/g, "");
  if (!s) return null;
  let norm: string;
  if (s.includes(",")) norm = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+\.\d{1,2}$/.test(s)) norm = s;
  else norm = s.replace(/\./g, "");
  const n = Number(norm);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Preostali dani u mjesecu uključujući danas (Zagreb), isto kao u aplikaciji. */
function daysLeftToday(): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(new Date());
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  return new Date(y, m, 0).getDate() - d + 1;
}

function addMonthsLabel(months: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return new Intl.DateTimeFormat("hr-HR", { month: "long", year: "numeric" }).format(d);
}

/** „1 mjesec“, „2 mjeseca“, „5 mjeseci“ (hrvatska množina). */
function months(n: number): string {
  const t = n % 10;
  const h = n % 100;
  if (t === 1 && h !== 11) return `${n} mjesec`;
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return `${n} mjeseca`;
  return `${n} mjeseci`;
}

function Field({ label, value, onChange, suffix = "€", hint }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string }) {
  const id = useId();
  return (
    <div className="calc-field">
      <label htmlFor={id}>{label}</label>
      <div className="calc-input">
        <input id={id} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
        <span aria-hidden="true">{suffix}</span>
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

function Result({ label, value, line, state = "ok" }: { label: string; value: string; line?: ReactNode; state?: "ok" | "warn" | "over" }) {
  return (
    <div className={`calc-result ${state}`} aria-live="polite">
      <span className="calc-result-label">{label}</span>
      <b className="calc-result-value">{value}</b>
      {line ? <p>{line}</p> : null}
    </div>
  );
}

function DailyBudget() {
  // Zadane vrijednosti su službeni primjer (isti brojevi na webu i u dokumentaciji), osim dana koji su stvarni.
  const [income, setIncome] = useState("1.468,00");
  const [fixed, setFixed] = useState("771,33");
  const [savings, setSavings] = useState("150,00");
  const [spent, setSpent] = useState("207,40");
  const [days, setDays] = useState(String(daysLeftToday()));
  const i = parseHr(income) ?? 0;
  const f = parseHr(fixed) ?? 0;
  const s = parseHr(savings) ?? 0;
  const p = parseHr(spent) ?? 0;
  const d = Math.max(1, Math.round(parseHr(days) ?? 1));
  // Ista definicija kao u aplikaciji (docs/APP-PLAN.md §4.2): (za trošenje − potrošeno prije danas) ÷ preostali dani s danas.
  const available = i - f - s;
  const daily = (available - p) / d;
  return (
    <div className="calc">
      <div className="calc-fields">
        <Field label="Mjesečna primanja" value={income} onChange={setIncome} />
        <Field label="Fiksni troškovi" value={fixed} onChange={setFixed} hint="Najam, režije, pretplate, rate" />
        <Field label="Mjesečna štednja" value={savings} onChange={setSavings} />
        <Field label="Već potrošeno ovaj mjesec" value={spent} onChange={setSpent} />
        <Field label="Preostalo dana (s danas)" value={days} onChange={setDays} suffix="dana" />
      </div>
      <Result
        label="Dnevni budžet"
        value={daily < 0 ? `−${eur(-daily)}` : eur(daily)}
        state={daily < 0 ? "over" : "ok"}
        line={daily < 0 ? `Ovaj mjesec si ${eur(-(available - p))} preko plana.` : `Za trošenje ostaje ${eur(available - p)} do kraja mjeseca.`}
      />
    </div>
  );
}

function Subscriptions() {
  const [rows, setRows] = useState([
    { name: "Streaming", amount: "12,99" },
    { name: "Glazba", amount: "10,99" },
    { name: "Mobitel", amount: "15,00" },
    { name: "Teretana", amount: "35,00" },
  ]);
  const monthly = rows.reduce((sum, r) => sum + (parseHr(r.amount) ?? 0), 0);
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((cur) => cur.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <div className="calc">
      <div className="calc-rows">
        {rows.map((r, i) => (
          <div key={i} className="calc-row">
            <input aria-label={`Naziv ${i + 1}`} value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Naziv" />
            <div className="calc-input">
              <input aria-label={`Iznos ${i + 1}`} inputMode="decimal" value={r.amount} onChange={(e) => set(i, { amount: e.target.value })} />
              <span aria-hidden="true">€</span>
            </div>
            <button type="button" className="calc-x" aria-label={`Ukloni ${r.name || "redak"}`} onClick={() => setRows((cur) => cur.filter((_, k) => k !== i))}>×</button>
          </div>
        ))}
        <button type="button" className="calc-add" onClick={() => setRows((cur) => [...cur, { name: "", amount: "" }])}>+ Dodaj pretplatu</button>
      </div>
      <Result label="Godišnje" value={eur(monthly * 12)} line={`${eur(monthly)} mjesečno · ${eur(monthly * 60)} kroz pet godina`} />
    </div>
  );
}

function EmergencyFund() {
  const [need, setNeed] = useState("1.100,00");
  const [mult, setMult] = useState(3);
  const [have, setHave] = useState("500,00");
  const [monthly, setMonthly] = useState("150,00");
  const target = (parseHr(need) ?? 0) * mult;
  const missing = Math.max(0, target - (parseHr(have) ?? 0));
  const m = parseHr(monthly) ?? 0;
  const n = missing === 0 ? 0 : m > 0 ? Math.ceil(missing / m) : null;
  return (
    <div className="calc">
      <div className="calc-fields">
        <Field label="Nužni mjesečni troškovi" value={need} onChange={setNeed} hint="Stanovanje, režije, hrana, prijevoz, rate" />
        <div className="calc-field">
          <span className="calc-field-label">Koliko mjeseci</span>
          <div className="calc-seg" role="radiogroup" aria-label="Koliko mjeseci">
            {[3, 6].map((v) => (
              <button key={v} type="button" role="radio" aria-checked={mult === v} className={mult === v ? "on" : ""} onClick={() => setMult(v)}>{v} mjeseci</button>
            ))}
          </div>
        </div>
        <Field label="Već imam sa strane" value={have} onChange={setHave} />
        <Field label="Mogu odvojiti mjesečno" value={monthly} onChange={setMonthly} />
      </div>
      <Result
        label="Cilj fonda"
        value={eur(target)}
        line={missing === 0 ? "Već imaš dovoljno. Lijepo." : n === null ? `Nedostaje ${eur(missing)}.` : `Nedostaje ${eur(missing)}: uz ovu štednju ${months(n)}, do ${addMonthsLabel(n)}.`}
      />
    </div>
  );
}

function SavingsGoal() {
  const [goal, setGoal] = useState("1.200,00");
  const [have, setHave] = useState("200,00");
  const [monthly, setMonthly] = useState("150,00");
  const missing = Math.max(0, (parseHr(goal) ?? 0) - (parseHr(have) ?? 0));
  const m = parseHr(monthly) ?? 0;
  const n = missing === 0 ? 0 : m > 0 ? Math.ceil(missing / m) : null;
  return (
    <div className="calc">
      <div className="calc-fields">
        <Field label="Cilj" value={goal} onChange={setGoal} hint="npr. godišnji odmor, auto, laptop" />
        <Field label="Već imam" value={have} onChange={setHave} />
        <Field label="Odvajam mjesečno" value={monthly} onChange={setMonthly} />
      </div>
      <Result
        label="Do cilja"
        value={n === null ? "—" : n === 0 ? "Već imaš" : months(n)}
        line={n === null ? "Upiši koliko mjesečno odvajaš." : n === 0 ? "Cilj je već pokriven." : `Nedostaje ${eur(missing)}. Uz ${eur(m)} mjesečno stižeš do ${addMonthsLabel(n)}.`}
      />
    </div>
  );
}

function SmallSpend() {
  const [price, setPrice] = useState("2,00");
  const [perWeek, setPerWeek] = useState("5");
  const yearly = (parseHr(price) ?? 0) * (parseHr(perWeek) ?? 0) * 52;
  return (
    <div className="calc">
      <div className="calc-fields">
        <Field label="Cijena" value={price} onChange={setPrice} hint="npr. kava, grickalice, dostava" />
        <Field label="Puta tjedno" value={perWeek} onChange={setPerWeek} suffix="×" />
      </div>
      <Result label="Godišnje" value={eur(yearly)} line={`${eur(yearly / 12)} mjesečno · ${eur(yearly * 10)} kroz deset godina`} />
    </div>
  );
}

export function Calculator({ slug }: { slug: CalcSlug }) {
  if (slug === "dnevni-budzet") return <DailyBudget />;
  if (slug === "pretplate") return <Subscriptions />;
  if (slug === "fond-za-hitne") return <EmergencyFund />;
  if (slug === "cilj-stednje") return <SavingsGoal />;
  return <SmallSpend />;
}
