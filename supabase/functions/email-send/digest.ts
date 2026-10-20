// Brojke za tjedni i mjesečni sažetak. Čisti TypeScript (bez Deno API-ja), testira se u packages/core.
// Isto pravilo kao aplikacija: potrošeno je BEZ knjiženih pretplata (one su u „obavezno“);
// raspoloživo = primanja (+ dodatni prihodi) − obavezno − štednja.
import { daysIn, obligatoryFor, type Recurring, type Tx } from "../insights/facts.ts";

export interface MonthPlanRow {
  month: string;
  income_cents: number;
  savings_cents: number;
  spent_before_cents?: number;
}

export interface DigestInput {
  transactions: Tx[];
  categories: { id: string; name: string }[];
  recurring: Recurring[];
  plans: MonthPlanRow[];
}

export interface CategoryTotal {
  name: string;
  cents: number;
}

export interface WeekSummary {
  start: string; // ponedjeljak, YYYY-MM-DD
  end: string; // nedjelja
  spentCents: number;
  /** Plan za tjedan (zbroj dnevnog plana po danima tog tjedna) ili null bez plana. */
  targetCents: number | null;
  daysWithEntries: number;
  entries: number;
  top: CategoryTotal | null;
}

export interface MonthSummary {
  month: string;
  spentCents: number;
  availableCents: number | null;
  top: CategoryTotal[];
  daysWithEntries: number;
}

const MONTHS = ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"];

export function monthName(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

/** Prošli tjedan (ponedjeljak do nedjelje) u odnosu na `today` i ISO oznaka tjedna („2026-W42“). */
export function lastWeek(today: string): { start: string; end: string; period: string } {
  const wd = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = ponedjeljak
  const start = addDays(today, -wd - 7);
  const end = addDays(start, 6);
  return { start, end, period: isoWeek(start) };
}

/** ISO 8601 tjedan za datum (tjedan pripada godini svog četvrtka). */
export function isoWeek(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd + 3); // četvrtak tog tjedna
  const year = d.getUTCFullYear();
  const dayOfYear = Math.round((d.getTime() - Date.UTC(year, 0, 1, 12)) / 86_400_000); // 0 = 1. siječnja
  const week = Math.floor(dayOfYear / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** Plan koji vrijedi u mjesecu: plan tog mjeseca, inače zadnji raniji (kao u aplikaciji). */
function planFor(plans: MonthPlanRow[], month: string): MonthPlanRow | null {
  let best: MonthPlanRow | null = null;
  for (const p of plans) if (p.month <= month && (!best || p.month > best.month)) best = p;
  return best;
}

/** Raspoloživo za trošenje u mjesecu ili null bez plana. */
export function availableFor(inp: DigestInput, month: string): number | null {
  const plan = planFor(inp.plans, month);
  if (!plan || plan.income_cents <= 0) return null;
  const extra = inp.transactions
    .filter((t) => t.type === "income" && t.source !== "recurring" && t.local_date.startsWith(month))
    .reduce((s, t) => s + t.amount_cents, 0);
  return plan.income_cents + extra - obligatoryFor(inp.recurring, month) - plan.savings_cents;
}

const variable = (t: Tx) => t.type === "expense" && t.source !== "recurring";

function topCategories(inp: DigestInput, txs: Tx[], n: number): CategoryTotal[] {
  const by = new Map<string | null, number>();
  for (const t of txs) by.set(t.category_id, (by.get(t.category_id) ?? 0) + t.amount_cents);
  const name = (id: string | null) => inp.categories.find((c) => c.id === id)?.name ?? "Bez kategorije";
  return [...by.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, cents]) => ({ name: name(id), cents }));
}

export function weekSummary(inp: DigestInput, start: string, end: string): WeekSummary {
  const txs = inp.transactions.filter((t) => variable(t) && t.local_date >= start && t.local_date <= end);
  const spentCents = txs.reduce((s, t) => s + t.amount_cents, 0);

  // Plan tjedna: svaki dan nosi (raspoloživo tog mjeseca ÷ dana u mjesecu); tjedan preko granice mjeseca je točan.
  let target = 0;
  let hasPlan = true;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const m = d.slice(0, 7);
    const avail = availableFor(inp, m);
    if (avail === null) {
      hasPlan = false;
      break;
    }
    target += Math.max(0, avail) / daysIn(m);
  }

  return {
    start,
    end,
    spentCents,
    targetCents: hasPlan ? Math.round(target) : null,
    daysWithEntries: new Set(inp.transactions.filter((t) => t.local_date >= start && t.local_date <= end && t.source !== "recurring").map((t) => t.local_date)).size,
    entries: txs.length,
    top: topCategories(inp, txs, 1)[0] ?? null,
  };
}

export function monthSummary(inp: DigestInput, month: string): MonthSummary {
  const txs = inp.transactions.filter((t) => variable(t) && t.local_date.startsWith(month));
  const plan = planFor(inp.plans, month);
  // Potrošeno prije početka praćenja (početak usred mjeseca) ulazi u potrošeno, kao u aplikaciji.
  const before = plan?.month === month ? (plan.spent_before_cents ?? 0) : 0;
  return {
    month,
    spentCents: txs.reduce((s, t) => s + t.amount_cents, 0) + before,
    availableCents: availableFor(inp, month),
    top: topCategories(inp, txs, 3),
    daysWithEntries: new Set(txs.map((t) => t.local_date)).size,
  };
}
