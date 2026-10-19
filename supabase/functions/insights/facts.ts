// Točne brojke za AI uvide. Sve se računa OVDJE (deterministički), a model kasnije samo preformulira tekst:
// ne smije dodavati nove brojke. Datoteka je čisti TypeScript (bez Deno API-ja) pa se testira u packages/core.

export interface Tx {
  amount_cents: number;
  type: "expense" | "income";
  category_id: string | null;
  local_date: string; // YYYY-MM-DD
  source: "manual" | "scan" | "recurring";
}
export interface Recurring {
  amount_cents: number;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
}
export interface Plan {
  income_cents: number;
  savings_cents: number;
}

export interface Fact {
  id: string;
  kind: "pace" | "category_up" | "category_down" | "top_category" | "weekday_peak" | "fixed_share" | "small_spends";
  tone: "info" | "good" | "warn";
  icon: string;
  title: string;
  body: string;
  /** Brojke koje smiju stajati u tekstu (u istom obliku kao u `body`): model ih ne smije mijenjati ni dodavati. */
  numbers: string[];
  priority: number;
}

export interface Input {
  today: string; // YYYY-MM-DD (Europe/Zagreb)
  month: string; // YYYY-MM, ≤ mjesec od `today`
  transactions: Tx[]; // zadnjih ~100 dana
  categories: { id: string; name: string }[];
  recurring: Recurring[];
  plan: Plan | null;
}

/** 1.234,56 € (hrvatski zapis; NBSP prije znaka € se ne koristi radi jednostavne usporedbe brojki). */
export function eur(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "−" : ""}${whole},${frac} €`;
}

const WEEKDAY_INSTR = ["nedjeljom", "ponedjeljkom", "utorkom", "srijedom", "četvrtkom", "petkom", "subotom"];

function daysIn(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m, 0).getDate();
}
function monthOf(date: string): string {
  return date.slice(0, 7);
}
function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

/** Zbroj mjesečnih fiksnih troškova koji vrijede u mjesecu (isto pravilo kao packages/core occurrenceDate). */
function obligatoryFor(items: Recurring[], month: string): number {
  const dim = daysIn(month);
  let total = 0;
  for (const it of items) {
    if (!it.active) continue;
    const day = Math.min(Math.max(1, it.day_of_month), dim);
    const date = `${month}-${String(day).padStart(2, "0")}`;
    if (date < it.start_date) continue;
    if (it.end_date && date > it.end_date) continue;
    total += it.amount_cents;
  }
  return total;
}

/** Varijabilni troškovi (bez knjiženih pretplata) po kategoriji u mjesecu, do `untilDay` (uključivo). */
function variableByCategory(txs: Tx[], month: string, untilDay = 31): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const t of txs) {
    if (t.type !== "expense" || t.source === "recurring" || monthOf(t.local_date) !== month) continue;
    if (Number(t.local_date.slice(8)) > untilDay) continue;
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount_cents);
  }
  return map;
}

export function computeFacts(inp: Input): Fact[] {
  const facts: Fact[] = [];
  const name = (id: string | null) => inp.categories.find((c) => c.id === id)?.name ?? "Bez kategorije";
  const isCurrent = inp.month === monthOf(inp.today);
  const dim = daysIn(inp.month);
  const dayNo = isCurrent ? Number(inp.today.slice(8)) : dim;

  const cur = variableByCategory(inp.transactions, inp.month, dayNo);
  const spent = [...cur.values()].reduce((s, v) => s + v, 0);

  // 1) Tempo: gdje mjesec završava ako se nastavi ovim tempom (samo za tekući mjesec s planom).
  if (isCurrent && inp.plan && dayNo >= 3) {
    const obligatory = obligatoryFor(inp.recurring, inp.month);
    const extra = inp.transactions
      .filter((t) => t.type === "income" && t.source !== "recurring" && monthOf(t.local_date) === inp.month)
      .reduce((s, t) => s + t.amount_cents, 0);
    const available = inp.plan.income_cents + extra - obligatory - inp.plan.savings_cents;
    if (available > 0) {
      const projected = Math.round((spent / dayNo) * dim);
      const ratio = projected / available;
      const body =
        ratio > 1.05
          ? `Do danas si potrošio ${eur(spent)}. Ovim tempom mjesec završava s ${eur(projected)}, a raspoloživo je ${eur(available)}.`
          : ratio < 0.95
            ? `Trošiš sporije od plana: do kraja mjeseca očekuj oko ${eur(projected)} od raspoloživih ${eur(available)}.`
            : `Trošiš po planu: do kraja mjeseca očekuj oko ${eur(projected)} od raspoloživih ${eur(available)}.`;
      facts.push({
        id: "pace",
        kind: "pace",
        tone: ratio > 1.05 ? "warn" : "good",
        icon: "chart",
        title: ratio > 1.05 ? "Trošiš brže od plana" : "Tempo je dobar",
        body,
        numbers: [eur(spent), eur(projected), eur(available)],
        priority: 90,
      });
    }
  }

  // 2) Kategorija koja je najviše narasla ili pala u odnosu na prosjek prethodna (do 3) mjeseca.
  const prevMonths = [prevMonth(inp.month), prevMonth(prevMonth(inp.month)), prevMonth(prevMonth(prevMonth(inp.month)))];
  const avg = new Map<string | null, number>();
  let usedMonths = 0;
  for (const pm of prevMonths) {
    const m = variableByCategory(inp.transactions, pm);
    if (m.size === 0) continue;
    usedMonths += 1;
    for (const [k, v] of m) avg.set(k, (avg.get(k) ?? 0) + v);
  }
  if (usedMonths >= 1 && isCurrent && dayNo >= 7) {
    type Move = { id: string | null; proj: number; base: number; pct: number };
    let up = null as Move | null;
    let down = null as Move | null;
    for (const [k, v] of cur) {
      const base = Math.round((avg.get(k) ?? 0) / usedMonths);
      const proj = Math.round((v / dayNo) * dim);
      if (base < 1500) continue; // premalo za usporedbu (< 15 €)
      const pct = Math.round(((proj - base) / base) * 100);
      if (pct >= 20 && proj - base >= 1500 && (!up || proj - base > up.proj - up.base)) up = { id: k, proj, base, pct };
      if (pct <= -20 && base - proj >= 1500 && (!down || base - proj > down.base - down.proj)) down = { id: k, proj, base, pct };
    }
    if (up) {
      facts.push({
        id: "category_up",
        kind: "category_up",
        tone: "warn",
        icon: "tag",
        title: `${name(up.id)} raste`,
        body: `${name(up.id)}: ovim tempom oko ${eur(up.proj)} ovaj mjesec, ${up.pct} % više nego prosjek (${eur(up.base)}).`,
        numbers: [eur(up.proj), `${up.pct} %`, eur(up.base)],
        priority: 80,
      });
    }
    if (down) {
      facts.push({
        id: "category_down",
        kind: "category_down",
        tone: "good",
        icon: "tag",
        title: `${name(down.id)} pada`,
        body: `${name(down.id)}: ovim tempom oko ${eur(down.proj)}, ${Math.abs(down.pct)} % manje nego prosjek (${eur(down.base)}).`,
        numbers: [eur(down.proj), `${Math.abs(down.pct)} %`, eur(down.base)],
        priority: 70,
      });
    }
  }

  // 3) Sitni troškovi: mnogo malih iznosa u zadnjih 30 dana.
  const since = new Date(inp.today + "T12:00:00");
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);
  const small = inp.transactions.filter((t) => t.type === "expense" && t.source !== "recurring" && t.local_date > sinceStr && t.local_date <= inp.today && t.amount_cents < 500);
  if (small.length >= 8) {
    const sum = small.reduce((s, t) => s + t.amount_cents, 0);
    facts.push({
      id: "small_spends",
      kind: "small_spends",
      tone: "info",
      icon: "cup",
      title: "Sitni troškovi se zbrajaju",
      body: `${small.length} troškova ispod 5 € u zadnjih 30 dana, ukupno ${eur(sum)}.`,
      numbers: [String(small.length), eur(sum)],
      priority: 60,
    });
  }

  // 4) Dan u tjednu s najvećom prosječnom potrošnjom (zadnjih ~90 dana, najmanje 15 troškova).
  const since90 = new Date(inp.today + "T12:00:00");
  since90.setDate(since90.getDate() - 90);
  const s90 = since90.toISOString().slice(0, 10);
  const recent = inp.transactions.filter((t) => t.type === "expense" && t.source !== "recurring" && t.local_date > s90 && t.local_date <= inp.today);
  if (recent.length >= 15) {
    const byDay = new Map<string, number>(); // datum → zbroj
    for (const t of recent) byDay.set(t.local_date, (byDay.get(t.local_date) ?? 0) + t.amount_cents);
    const sums = Array.from({ length: 7 }, () => ({ total: 0, days: 0 }));
    for (const [d, v] of byDay) {
      const wd = new Date(d + "T12:00:00").getDay();
      sums[wd]!.total += v;
      sums[wd]!.days += 1;
    }
    let best = -1;
    let bestAvg = 0;
    sums.forEach((s, i) => {
      if (s.days < 3) return;
      const a = Math.round(s.total / s.days);
      if (a > bestAvg) {
        bestAvg = a;
        best = i;
      }
    });
    if (best >= 0) {
      facts.push({
        id: "weekday_peak",
        kind: "weekday_peak",
        tone: "info",
        icon: "calendar",
        title: "Tvoj skuplji dan",
        body: `Najviše trošiš ${WEEKDAY_INSTR[best]}: prosječno ${eur(bestAvg)} tim danom.`,
        numbers: [eur(bestAvg)],
        priority: 50,
      });
    }
  }

  // 5) Najveća kategorija ovaj mjesec.
  if (cur.size > 0 && spent > 0) {
    const [topId, topVal] = [...cur.entries()].sort((a, b) => b[1] - a[1])[0]!;
    const pct = Math.round((topVal / spent) * 100);
    if (pct >= 30) {
      facts.push({
        id: "top_category",
        kind: "top_category",
        tone: "info",
        icon: "cart",
        title: `Najviše ide na ${name(topId).toLowerCase()}`,
        body: `${name(topId)}: ${eur(topVal)}, ${pct} % tvojih varijabilnih troškova ${isCurrent ? "ovaj mjesec" : "tog mjeseca"}.`,
        numbers: [eur(topVal), `${pct} %`],
        priority: 40,
      });
    }
  }

  // 6) Fiksni troškovi i pretplate: udio primanja i godišnji zbroj.
  const obligatory = obligatoryFor(inp.recurring, inp.month);
  if (inp.plan && inp.plan.income_cents > 0 && obligatory > 0) {
    const pct = Math.round((obligatory / inp.plan.income_cents) * 100);
    facts.push({
      id: "fixed_share",
      kind: "fixed_share",
      tone: "info",
      icon: "repeat",
      title: "Fiksni troškovi i pretplate",
      body: `${eur(obligatory)} mjesečno (${pct} % primanja), ${eur(obligatory * 12)} godišnje.`,
      numbers: [eur(obligatory), `${pct} %`, eur(obligatory * 12)],
      priority: 30,
    });
  }

  return facts.sort((a, b) => b.priority - a.priority);
}

/** Svaka brojka u tekstu mora biti među dopuštenima (iz činjenice); inače se tekst odbacuje i koristi predložak. */
export function numbersAreSubset(text: string, allowed: string[]): boolean {
  const found = text.match(/[−-]?\d[\d.]*(?:,\d+)?\s?(?:€|%)?/g) ?? [];
  const norm = (s: string) => s.replace(/\s/g, "").replace(/-/g, "−");
  const allowedSet = new Set(allowed.map(norm));
  return found.every((f) => {
    const n = norm(f);
    if (allowedSet.has(n)) return true;
    // goli brojevi bez oznake (npr. „5“ u „ispod 5 €“ ili „30 dana“) dopuštamo samo ako su u dopuštenom skupu kao dio većeg zapisa
    return [...allowedSet].some((a) => a.startsWith(n) || a.replace(/[€%]/g, "") === n);
  });
}
