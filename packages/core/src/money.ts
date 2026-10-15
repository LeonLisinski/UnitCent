/**
 * Novac: iznosi su UVIJEK cijeli brojevi u centima. Nikad float.
 * Ovo je jedino mjesto gdje se iznosi parsiraju i formatiraju (aplikacija, web, Edge Functions).
 */
export type Cents = number;

const NBSP = " ";
const MINUS = "−";

/** Zbroj centi (jasnije od reduce na svakom mjestu). */
export function sumCents(values: readonly Cents[]): Cents {
  let t = 0;
  for (const v of values) t += v;
  return t;
}

/**
 * Parsira unos korisnika ("12,50", "1.234,56", "12.5", "12") u cente.
 * Vraća null za nevaljan unos. Negativni iznosi se ne prihvaćaju (smjer određuje tip transakcije).
 * "1.234" i "1,234" tumače se kao tisućice (1234 €), a "12.5" i "12,5" kao decimale.
 */
export function parseAmount(input: string): Cents | null {
  const s = input.replace(/[\s ]/g, "");
  if (s === "") return null;
  if (!/^(\d{1,3}([.,]\d{3})+|\d+)([.,]\d{1,2})?$/.test(s)) return null;

  // Zadnji separator odvaja decimale samo ako iza njega slijedi 1 ili 2 znamenke.
  const m = /[.,](\d{1,2})$/.exec(s);
  let intPart = s;
  let frac = "";
  if (m && m[1] !== undefined) {
    // "1.234" završava s 3 znamenke pa ne pada ovdje; "12.5" i "12,50" padaju.
    intPart = s.slice(0, s.length - m[0].length);
    frac = m[1];
    // Isti znak ne smije biti i separator tisućica i decimalni separator ("12,345,6" je nevaljano).
    const decimalSep = m[0].charAt(0);
    if (intPart.includes(decimalSep)) return null;
  }
  const euros = Number(intPart.replace(/[.,]/g, ""));
  if (!Number.isSafeInteger(euros)) return null;
  const cents = frac === "" ? 0 : Number(frac.padEnd(2, "0"));
  const total = euros * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

/**
 * Formatira cente po hrvatskom standardu: "1.234,56 €" (točka za tisućice, zarez za decimale,
 * nerazdvojni razmak prije €). Negativni iznosi dobivaju pravi minus (U+2212).
 * Namjerno bez Intl: isti rezultat na svim platformama i verzijama motora.
 */
export function formatEur(cents: Cents, opts: { sign?: boolean } = {}): string {
  const neg = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = neg ? MINUS : opts.sign && cents > 0 ? "+" : "";
  return `${sign}${grouped},${rest}${NBSP}€`;
}

/** Cjelobrojno dijeljenje s zaokruživanjem na najbliži cent (polovina se zaokružuje od nule). */
export function divRound(numerator: Cents, denominator: number): Cents {
  if (!Number.isInteger(denominator) || denominator <= 0) {
    throw new RangeError("divRound: djelitelj mora biti pozitivan cijeli broj");
  }
  const sign = numerator < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(numerator) / denominator);
}
