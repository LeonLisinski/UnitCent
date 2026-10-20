"use client";

import { useId, useState, type ReactNode } from "react";
import type { CalcSlug } from "./data";

/* Kalkulatori rade samo u pregledniku: ništa se ne šalje ni ne sprema. Iznosi su u eurima, hrvatski zapis.
 * Raspored: lijevo unos (skupine polja), desno rezultat na zelenoj plohi (broj je junak, graf u bojama kategorija).
 * Na mobitelu rezultat ide prvi, polja ispod. Klase imaju prefiks `cx-` (globals.css već ima `.calc` za početnu). */

const nf2 = new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur = (v: number) => `${v < 0 ? "−" : ""}${nf2.format(Math.abs(v))} €`;

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
  // hr-HR dodaje točku iza godine („svibanj 2028.“); rečenica ima svoju, pa je mičemo.
  return new Intl.DateTimeFormat("hr-HR", { month: "long", year: "numeric" }).format(d).replace(/\.$/, "");
}

/** Hrvatska množina: 1 mjesec, 2 do 4 mjeseca, 5+ mjeseci (11 do 14 su „mnogo“). */
function plural(n: number, one: string, few: string, many: string): string {
  const t = n % 10;
  const h = n % 100;
  if (t === 1 && h !== 11) return one;
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return few;
  return many;
}
const months = (n: number) => `${n} ${plural(n, "mjesec", "mjeseca", "mjeseci")}`;

/* ---------- gradivni elementi ---------- */

function Field({ label, value, onChange, suffix = "€", hint, dot }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string; dot?: string }) {
  const id = useId();
  return (
    <div className="cx-field">
      <label htmlFor={id}>
        {dot ? <i className="cx-dot" style={{ background: dot }} aria-hidden="true" /> : null}
        {label}
      </label>
      <div className="cx-input">
        <input id={id} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
        <span aria-hidden="true">{suffix}</span>
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

/** Skupina polja s oznakom (mono). `pair` slaže dva polja u red na širim ekranima. */
function Group({ label, pair, children }: { label: string; pair?: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <div className="cx-group" role="group" aria-labelledby={id}>
      <span className="cx-group-label" id={id}>{label}</span>
      <div className={pair ? "cx-pair" : "cx-stack"}>{children}</div>
    </div>
  );
}

type Tone = "ok" | "over";

/** Rezultat: oznaka, glavni broj, jedna crta, graf i najviše tri pomoćna podatka. */
function Result({ label, value, line, tone = "ok", children, stats }: { label: string; value: string; line?: ReactNode; tone?: Tone; children?: ReactNode; stats?: { label: string; value: string }[] }) {
  return (
    <section className={`cx-result ${tone}`} aria-live="polite" aria-label={label}>
      <span className="cx-label">{label}</span>
      <b className="cx-value">{value}</b>
      {line ? <p className="cx-line">{line}</p> : null}
      {children ? <div className="cx-viz">{children}</div> : null}
      {stats && stats.length ? (
        <dl className="cx-stats">
          {stats.slice(0, 3).map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

/** Isječci s ravnim krajevima i fiksnim razmakom (bez preklapanja), s legendom ispod. */
function Segments({ parts, legend = true }: { parts: { label: string; value: number; color: string }[]; legend?: boolean }) {
  const shown = parts.filter((p) => p.value > 0);
  const total = shown.reduce((s, p) => s + p.value, 0);
  return (
    <div className="cx-seg-wrap">
      <div className="cx-seg" role="img" aria-label={shown.map((p) => `${p.label} ${eur(p.value)}`).join(", ")}>
        {total > 0 ? shown.map((p) => <span key={p.label} style={{ flexGrow: p.value, background: p.color }} />) : <span style={{ flexGrow: 1 }} className="empty" />}
      </div>
      {legend ? (
        <ul className="cx-legend">
          {parts.map((p) => (
            <li key={p.label}>
              <i className="cx-dot" style={{ background: p.color }} aria-hidden="true" />
              <span>{p.label}</span>
              <b>{eur(p.value)}</b>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Traka napretka: koliko od cilja već imaš. */
function Progress({ have, target, haveLabel, targetLabel }: { have: number; target: number; haveLabel: string; targetLabel: string }) {
  const pct = target > 0 ? Math.min(100, Math.max(0, (have / target) * 100)) : 0;
  return (
    <div className="cx-progress">
      <div className="cx-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={`${Math.round(pct)} % cilja`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="cx-progress-labels">
        <span>{haveLabel}</span>
        <span>{targetLabel}</span>
      </div>
    </div>
  );
}

function Layout({ inputs, result }: { inputs: ReactNode; result: ReactNode }) {
  return (
    <div className="cx">
      <div className="cx-inputs">{inputs}</div>
      {result}
    </div>
  );
}

const COLOR = {
  fixed: "var(--cat-stan)",
  savings: "var(--brand)",
  spent: "var(--cat-zabava)",
  left: "var(--accent)",
};
const SUB_COLORS = ["var(--cat-auto)", "var(--cat-zabava)", "var(--cat-zdravlje)", "var(--cat-pretplate)", "var(--cat-stan)", "var(--cat-hrana)", "var(--cat-cigarete)"];

/* ---------- kalkulatori ---------- */

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
  const left = available - p;
  const daily = left / d;
  const over = daily < 0;
  return (
    <Layout
      inputs={
        <>
          <Group label="Mjesečno">
            <Field label="Primanja" value={income} onChange={setIncome} />
            <Field label="Fiksni troškovi" value={fixed} onChange={setFixed} hint="Najam, režije, pretplate, rate" dot={COLOR.fixed} />
            <Field label="Štednja" value={savings} onChange={setSavings} dot={COLOR.savings} />
          </Group>
          <Group label="Ovaj mjesec" pair>
            <Field label="Već potrošeno" value={spent} onChange={setSpent} dot={COLOR.spent} />
            <Field label="Preostalo dana" value={days} onChange={setDays} suffix={plural(d, "dan", "dana", "dana")} hint="Uključujući danas" />
          </Group>
        </>
      }
      result={
        <Result
          label="Dnevni budžet"
          value={eur(daily)}
          tone={over ? "over" : "ok"}
          line={over ? `Ovaj mjesec ${eur(-left)} preko plana.` : `${eur(left)} za ${d} ${plural(d, "dan", "dana", "dana")} do kraja mjeseca.`}
        >
          <Segments
            parts={[
              { label: "Fiksno", value: f, color: COLOR.fixed },
              { label: "Štednja", value: s, color: COLOR.savings },
              { label: "Potrošeno", value: Math.min(p, Math.max(0, available)), color: COLOR.spent },
              { label: "Ostaje", value: Math.max(0, left), color: COLOR.left },
            ]}
          />
        </Result>
      }
    />
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
  const color = (i: number) => SUB_COLORS[i % SUB_COLORS.length]!;
  return (
    <Layout
      inputs={
        <Group label="Tvoje pretplate (mjesečno)">
          {rows.map((r, i) => (
            <div key={i} className="cx-row">
              <i className="cx-dot" style={{ background: color(i) }} aria-hidden="true" />
              <input className="cx-name" aria-label={`Naziv ${i + 1}`} value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Naziv" />
              <div className="cx-input cx-amount">
                <input aria-label={`Iznos ${i + 1}`} inputMode="decimal" value={r.amount} onChange={(e) => set(i, { amount: e.target.value })} placeholder="0,00" />
                <span aria-hidden="true">€</span>
              </div>
              <button type="button" className="cx-x" aria-label={`Ukloni ${r.name || "redak"}`} onClick={() => setRows((cur) => cur.filter((_, k) => k !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="cx-add" onClick={() => setRows((cur) => [...cur, { name: "", amount: "" }])}>+ Dodaj pretplatu</button>
        </Group>
      }
      result={
        <Result
          label="Godišnje"
          value={eur(monthly * 12)}
          line={`${rows.length} ${plural(rows.length, "pretplata", "pretplate", "pretplata")}`}
          stats={[
            { label: "Mjesečno", value: eur(monthly) },
            { label: "Kroz 5 godina", value: eur(monthly * 60) },
          ]}
        >
          <Segments legend={false} parts={rows.map((r, i) => ({ label: r.name || `Pretplata ${i + 1}`, value: (parseHr(r.amount) ?? 0) * 12, color: color(i) }))} />
        </Result>
      }
    />
  );
}

function EmergencyFund() {
  const [need, setNeed] = useState("1.100,00");
  const [mult, setMult] = useState(3);
  const [have, setHave] = useState("500,00");
  const [monthly, setMonthly] = useState("150,00");
  const target = (parseHr(need) ?? 0) * mult;
  const h = parseHr(have) ?? 0;
  const missing = Math.max(0, target - h);
  const m = parseHr(monthly) ?? 0;
  const n = missing === 0 ? 0 : m > 0 ? Math.ceil(missing / m) : null;
  return (
    <Layout
      inputs={
        <>
          <Group label="Cilj">
            <Field label="Nužni mjesečni troškovi" value={need} onChange={setNeed} hint="Stanovanje, režije, hrana, prijevoz, rate" />
            <div className="cx-field">
              <span className="cx-field-label">Za koliko mjeseci</span>
              <div className="cx-seg-choice" role="radiogroup" aria-label="Za koliko mjeseci">
                {[3, 6].map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={mult === v} className={mult === v ? "on" : ""} onClick={() => setMult(v)}>{v} mjeseci</button>
                ))}
              </div>
            </div>
          </Group>
          <Group label="Štednja" pair>
            <Field label="Već imam" value={have} onChange={setHave} />
            <Field label="Odvajam mjesečno" value={monthly} onChange={setMonthly} />
          </Group>
        </>
      }
      result={
        <Result
          label="Cilj fonda"
          value={eur(target)}
          line={missing === 0 ? "Fond je pun." : n === null ? `Nedostaje ${eur(missing)}.` : `Pun do ${addMonthsLabel(n)}.`}
          stats={missing === 0 ? undefined : [
            { label: "Nedostaje", value: eur(missing) },
            { label: "Još", value: n === null ? "—" : months(n) },
          ]}
        >
          <Progress have={Math.min(h, target)} target={target} haveLabel={`Imaš ${eur(h)}`} targetLabel={`${target > 0 ? Math.min(100, Math.round((h / target) * 100)) : 0} %`} />
        </Result>
      }
    />
  );
}

function SavingsGoal() {
  const [goal, setGoal] = useState("1.200,00");
  const [have, setHave] = useState("200,00");
  const [monthly, setMonthly] = useState("150,00");
  const g = parseHr(goal) ?? 0;
  const h = parseHr(have) ?? 0;
  const missing = Math.max(0, g - h);
  const m = parseHr(monthly) ?? 0;
  const n = missing === 0 ? 0 : m > 0 ? Math.ceil(missing / m) : null;
  return (
    <Layout
      inputs={
        <>
          <Group label="Cilj">
            <Field label="Iznos cilja" value={goal} onChange={setGoal} hint="npr. godišnji odmor, auto, laptop" />
          </Group>
          <Group label="Štednja" pair>
            <Field label="Već imam" value={have} onChange={setHave} />
            <Field label="Odvajam mjesečno" value={monthly} onChange={setMonthly} />
          </Group>
        </>
      }
      result={
        <Result
          label="Do cilja"
          value={n === null ? "—" : n === 0 ? "Gotovo" : months(n)}
          line={n === null ? "Upiši koliko mjesečno odvajaš." : n === 0 ? "Cilj je već pokriven." : `Stižeš do ${addMonthsLabel(n)}.`}
          stats={missing === 0 ? undefined : [{ label: "Nedostaje", value: eur(missing) }]}
        >
          <Progress have={Math.min(h, g)} target={g} haveLabel={`Imaš ${eur(h)}`} targetLabel={`Cilj ${eur(g)}`} />
        </Result>
      }
    />
  );
}

function SmallSpend() {
  const [price, setPrice] = useState("2,00");
  const [perWeek, setPerWeek] = useState("5");
  const yearly = (parseHr(price) ?? 0) * (parseHr(perWeek) ?? 0) * 52;
  return (
    <Layout
      inputs={
        <Group label="Sitni trošak" pair>
          <Field label="Cijena" value={price} onChange={setPrice} hint="npr. kava, grickalice, dostava" />
          <Field label="Koliko puta tjedno" value={perWeek} onChange={setPerWeek} suffix="×" />
        </Group>
      }
      result={
        <Result
          label="Godišnje"
          value={eur(yearly)}
          stats={[
            { label: "Mjesečno", value: eur(yearly / 12) },
            { label: "Kroz 10 godina", value: eur(yearly * 10) },
          ]}
        />
      }
    />
  );
}

export function Calculator({ slug }: { slug: CalcSlug }) {
  if (slug === "dnevni-budzet") return <DailyBudget />;
  if (slug === "pretplate") return <Subscriptions />;
  if (slug === "fond-za-hitne") return <EmergencyFund />;
  if (slug === "cilj-stednje") return <SavingsGoal />;
  return <SmallSpend />;
}
