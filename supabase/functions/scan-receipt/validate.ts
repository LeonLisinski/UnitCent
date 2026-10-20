export interface RawItem {
  raw_name: string;
  name: string;
  amount_cents: number;
  category_id: string | null;
  line_type: "item" | "discount" | "deposit";
  confidence: number;
}

export interface RawScan {
  legible: boolean;
  merchant: string | null;
  date: string | null; // YYYY-MM-DD
  total_cents: number | null;
  /** ISO kod valute računa (npr. "RSD") ili null. */
  currency?: string | null;
  items: RawItem[];
}

export interface ScanResult {
  status: "ok" | "review" | "unreadable";
  merchant: string | null;
  date: string | null;
  total_cents: number | null;
  sum_cents: number;
  items: RawItem[];
  reasons: string[];
}

const TOLERANCE_CENTS = 2; // zaokruživanje na računima

/**
 * Provjerava izlaz modela: ID-evi kategorija moraju postojati, iznosi su cijeli brojevi, zbroj svih redaka
 * (stavke + popusti + povratna naknada) mora odgovarati ukupnom iznosu (QR je izvor istine ako postoji).
 */
export function validate(raw: RawScan, categoryIds: Set<string>, qrTotal?: number): ScanResult {
  const reasons: string[] = [];
  if (!raw.legible || !Array.isArray(raw.items) || raw.items.length === 0) {
    return { status: "unreadable", merchant: null, date: null, total_cents: null, sum_cents: 0, items: [], reasons: ["Račun nije čitljiv"] };
  }

  let items = raw.items.map((i) => ({
    ...i,
    amount_cents: Math.round(Number(i.amount_cents) || 0),
    category_id: i.category_id && categoryIds.has(i.category_id) ? i.category_id : null,
    confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0)),
  }));
  const printed = raw.total_cents === null ? null : Math.round(raw.total_cents);
  const total = typeof qrTotal === "number" && Number.isFinite(qrTotal) ? Math.round(qrTotal) : printed;
  if (total !== null) items = fixDualCurrency(items, total);
  const sum = items.reduce((s, i) => s + i.amount_cents, 0);

  if (total === null) reasons.push("Ukupni iznos nije pročitan");
  else if (Math.abs(sum - total) > TOLERANCE_CENTS) reasons.push("Zbroj stavki se ne slaže s ukupnim iznosom");
  if (typeof qrTotal === "number" && printed !== null && Math.abs(printed - Math.round(qrTotal)) > TOLERANCE_CENTS) {
    reasons.push("Ispisani iznos se razlikuje od QR koda");
  }
  if (raw.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) reasons.push("Datum nije prepoznat");
  if (items.some((i) => i.category_id === null)) reasons.push("Neke stavke nemaju kategoriju");

  const blocking = reasons.some((r) => !r.startsWith("Neke stavke"));
  return {
    status: blocking ? "review" : "ok",
    merchant: raw.merchant,
    date: raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null,
    total_cents: total,
    sum_cents: sum,
    items,
    reasons,
  };
}

/** Fiksni tečajevi računa s dvije valute (kn/€ 2023., lev/€ 2026.): jedinica stare valute za 1 €. */
const DUAL_RATES = [7.5345, 1.95583];

/**
 * Popravci kad se zbroj stavki ne slaže s ukupnim (vraća nove stavke ili iste ako popravak nije siguran):
 *  - popust već uračunat u cijenu (zbroj bez popusta = ukupno): redak popusta se uklanja, inače bi se oduzeo dvaput;
 *  - račun s dvije valute: model stavke pročita u staroj valuti (kune, levi), a ukupno u eurima. Ako se razlikuju
 *    za fiksni tečaj, stavke se pretvaraju; razlika zaokruživanja (najviše nekoliko centi) ide na najveću stavku.
 * Među mogućnostima bira onu s najmanjim odstupanjem; ako nijedna nije unutar granice, ništa se ne mijenja.
 */
export function fixDualCurrency(items: RawItem[], total: number): RawItem[] {
  if (total <= 0 || items.length === 0) return items;
  const sum = items.reduce((s, i) => s + i.amount_cents, 0);
  if (Math.abs(sum - total) <= TOLERANCE_CENTS) return items;
  let best: { list: RawItem[]; err: number } | null = null;
  for (const rate of [1, ...DUAL_RATES]) {
    for (const keepDiscounts of [true, false]) {
      // Popusti/naknade su ponekad već u eurima (ne dijele se), ponekad u staroj valuti (dijele se).
      for (const scaleAdj of rate === 1 ? [false] : [true, false]) {
        if (rate === 1 && keepDiscounts) continue; // to je izvorni zbroj
        const list = items
          .filter((i) => keepDiscounts || i.line_type !== "discount")
          .map((i) => ({ ...i, amount_cents: i.line_type === "item" || scaleAdj ? Math.round(i.amount_cents / rate) : i.amount_cents }));
        const err = Math.abs(list.reduce((a, i) => a + i.amount_cents, 0) - total);
        if (err <= Math.max(TOLERANCE_CENTS + 2, total * 0.005) && (!best || err < best.err)) best = { list, err };
      }
    }
  }
  if (!best) return items;
  const s = best.list.reduce((a, i) => a + i.amount_cents, 0);
  let top = 0;
  best.list.forEach((v, k) => (v.amount_cents > best!.list[top]!.amount_cents ? (top = k) : null));
  best.list[top]!.amount_cents += total - s;
  return best.list;
}
