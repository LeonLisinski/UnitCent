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

  const items = raw.items.map((i) => ({
    ...i,
    amount_cents: Math.round(Number(i.amount_cents) || 0),
    category_id: i.category_id && categoryIds.has(i.category_id) ? i.category_id : null,
    confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0)),
  }));
  const sum = items.reduce((s, i) => s + i.amount_cents, 0);

  const printed = raw.total_cents === null ? null : Math.round(raw.total_cents);
  const total = typeof qrTotal === "number" && Number.isFinite(qrTotal) ? Math.round(qrTotal) : printed;

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
