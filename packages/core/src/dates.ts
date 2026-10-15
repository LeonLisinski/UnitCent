/**
 * Datumi: troškovi imaju LOKALNI datum korisnika kao tekst "YYYY-MM-DD" (nema vremenskih zona u računici).
 * Sve funkcije su čiste i rade samo s tim tekstom.
 */
export type LocalDate = string; // "YYYY-MM-DD"
export type YearMonth = string; // "YYYY-MM"

export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

export function parseLocalDate(s: LocalDate): Ymd {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new RangeError(`Neispravan datum: ${s}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) throw new RangeError(`Neispravan datum: ${s}`);
  return { y, m: mo, d };
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

export function toLocalDate(y: number, m: number, d: number): LocalDate {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function yearMonthOf(date: LocalDate): YearMonth {
  return date.slice(0, 7);
}

export function parseYearMonth(ym: YearMonth): { y: number; m: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) throw new RangeError(`Neispravan mjesec: ${ym}`);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new RangeError(`Neispravan mjesec: ${ym}`);
  return { y: Number(m[1]), m: mo };
}

/** Preostali dani u mjesecu UKLJUČUJUĆI danas (zadnji dan mjeseca = 1). */
export function daysLeftInclusive(today: LocalDate): number {
  const { y, m, d } = parseLocalDate(today);
  return daysInMonth(y, m) - d + 1;
}

/**
 * Današnji lokalni datum u zadanoj vremenskoj zoni (zadano Europe/Zagreb).
 * Jedina funkcija koja koristi sat; ostatak domene je deterministički.
 */
export function todayInZone(now: Date, timeZone = "Europe/Zagreb"): LocalDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA daje "YYYY-MM-DD"
}
