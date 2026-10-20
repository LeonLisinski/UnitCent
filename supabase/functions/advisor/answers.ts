// Odgovori AI savjetnika (pitanja na dodir). Brojke računa OVDJE (deterministički); model ih kasnije samo preformulira
// i ne smije dodati nove. Čisti TypeScript bez Deno API-ja, pa se testira u packages/core (test/advisor.test.ts).
import { computeFacts, eur, type Input } from "../insights/facts.ts";

export const QUESTIONS = ["where", "save", "subs", "month_end"] as const;
export type QuestionKey = (typeof QUESTIONS)[number];

/** Pitanje kako ga korisnik vidi (isto kao u aplikaciji); ide modelu da odgovor zvuči kao odgovor na njega. */
export const QUESTION_TEXT: Record<QuestionKey, string> = {
  month_end: "Kako stojim ovaj mjesec?",
  where: "Na što mi ide najviše novca?",
  save: "Gdje mogu uštedjeti?",
  subs: "Koliko me koštaju pretplate?",
};

export interface RecurringNamed {
  name: string;
  amount_cents: number;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
}

export interface AnswerRow {
  label: string;
  cents: number;
  /** Udio 0–1 za traku (npr. udio kategorije u troškovima). */
  share: number;
}

export interface Answer {
  key: QuestionKey;
  /** Tekst odgovora (predložak; model ga može preformulirati). Imena pretplata su zamijenjena oznakama {A}, {B}… */
  body: string;
  /** Brojke koje smiju stajati u tekstu. */
  numbers: string[];
  /** Oznake {n} koje moraju ostati u tekstu (zamjenjuju se imenima tek nakon modela). */
  placeholders: Record<string, string>;
  rows: AnswerRow[];
  /** Nema dovoljno podataka: odgovor je samo objašnjenje, ne troši kvotu. */
  empty: boolean;
}

function daysIn(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m, 0).getDate();
}

/** Varijabilni troškovi (bez knjiženih pretplata) po kategoriji u mjesecu do danas. */
function byCategory(inp: Input): { id: string | null; cents: number }[] {
  const map = new Map<string | null, number>();
  for (const t of inp.transactions) {
    if (t.type !== "expense" || t.source === "recurring" || t.local_date.slice(0, 7) !== inp.month || t.local_date > inp.today) continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount_cents);
  }
  return [...map.entries()].map(([id, cents]) => ({ id, cents })).sort((a, b) => b.cents - a.cents);
}

function occursIn(it: RecurringNamed, month: string): boolean {
  if (!it.active) return false;
  const day = Math.min(Math.max(1, it.day_of_month), daysIn(month));
  const date = `${month}-${String(day).padStart(2, "0")}`;
  return date >= it.start_date && (!it.end_date || date <= it.end_date);
}

const empty = (key: QuestionKey, body: string): Answer => ({ key, body, numbers: [], placeholders: {}, rows: [], empty: true });

export function answer(key: QuestionKey, inp: Input, recurring: RecurringNamed[]): Answer {
  const name = (id: string | null) => inp.categories.find((c) => c.id === id)?.name ?? "Bez kategorije";
  const cats = byCategory(inp);
  const spent = cats.reduce((s, c) => s + c.cents, 0);

  if (key === "where") {
    if (spent <= 0) return empty(key, "Ovaj mjesec još nema troškova. Kad ih uneseš nekoliko, reći ću ti kamo ide novac.");
    const top = cats.slice(0, 3);
    const pct = (c: number) => Math.round((c / spent) * 100);
    const first = top[0]!;
    const rest = top.slice(1).map((c) => `${name(c.id)} (${eur(c.cents)})`);
    const body =
      `Na prvom mjestu je ${name(first.id)} s ${eur(first.cents)}, to je ${pct(first.cents)} % ovomjesečnih troškova.` +
      (rest.length ? ` Slijede ${rest.join(" i ")}.` : "");
    return {
      key,
      body,
      numbers: [eur(first.cents), `${pct(first.cents)} %`, ...top.slice(1).map((c) => eur(c.cents))],
      placeholders: {},
      rows: top.map((c) => ({ label: name(c.id), cents: c.cents, share: c.cents / spent })),
      empty: false,
    };
  }

  if (key === "save") {
    const facts = computeFacts(inp);
    const up = facts.find((f) => f.id === "category_up");
    const small = facts.find((f) => f.id === "small_spends");
    const top = facts.find((f) => f.id === "top_category");
    const picked = [up, small, top].filter(Boolean).slice(0, 2) as NonNullable<typeof up>[];
    if (picked.length === 0) return empty(key, "Za sad ne vidim očito mjesto za uštedu. Što više unosa, to bolji savjet.");
    return { key, body: picked.map((f) => f.body).join(" "), numbers: picked.flatMap((f) => f.numbers), placeholders: {}, rows: [], empty: false };
  }

  if (key === "subs") {
    const items = recurring.filter((r) => occursIn(r, inp.month)).sort((a, b) => b.amount_cents - a.amount_cents);
    if (items.length === 0) return empty(key, "Nemaš upisanih pretplata ni fiksnih troškova za ovaj mjesec.");
    const total = items.reduce((s, r) => s + r.amount_cents, 0);
    const top = items.slice(0, 5);
    const placeholders: Record<string, string> = { "{A}": top[0]!.name };
    const body =
      `Na pretplate i fiksne troškove ide ti ${eur(total)} mjesečno, odnosno ${eur(total * 12)} godišnje. ` +
      `Najviše odlazi na {A}: ${eur(top[0]!.amount_cents)} mjesečno.`;
    return {
      key,
      body,
      numbers: [eur(total), eur(total * 12), eur(top[0]!.amount_cents), eur(top[0]!.amount_cents * 12)],
      placeholders,
      rows: top.map((r) => ({ label: r.name, cents: r.amount_cents, share: r.amount_cents / total })),
      empty: false,
    };
  }

  // month_end
  const pace = computeFacts(inp).find((f) => f.id === "pace");
  if (!pace) return empty(key, "Za procjenu kraja mjeseca trebaju mi plan i barem tri dana unosa.");
  const lead = pace.tone === "warn" ? "Malo je tijesno." : "Dobro stojiš.";
  return { key, body: `${lead} ${pace.body}`, numbers: pace.numbers, placeholders: {}, rows: [], empty: false };
}

/** Oznake moraju ostati u tekstu modela; nakon provjere se zamjenjuju imenima. */
export function fillPlaceholders(text: string, placeholders: Record<string, string>): string | null {
  for (const p of Object.keys(placeholders)) if (!text.includes(p)) return null;
  let out = text;
  for (const [p, v] of Object.entries(placeholders)) out = out.split(p).join(v);
  return out;
}
