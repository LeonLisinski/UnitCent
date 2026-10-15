import type { Cents } from "./money";
import { daysInMonth, parseYearMonth, toLocalDate, type LocalDate, type YearMonth } from "./dates";

/** Pretplata ili fiksni trošak koji se knjiži svaki mjesec na isti dan. */
export interface RecurringItem {
  id: string;
  name: string;
  amountCents: Cents;
  /** 1–31. U kraćem mjesecu knjiži se na zadnji dan mjeseca. */
  dayOfMonth: number;
  active: boolean;
  startDate: LocalDate;
  endDate?: LocalDate | null;
}

/** Datum naplate u zadanom mjesecu ili null ako stavka tada ne vrijedi. */
export function occurrenceDate(item: RecurringItem, month: YearMonth): LocalDate | null {
  if (!item.active) return null;
  if (!Number.isInteger(item.dayOfMonth) || item.dayOfMonth < 1 || item.dayOfMonth > 31) return null;
  const { y, m } = parseYearMonth(month);
  const day = Math.min(item.dayOfMonth, daysInMonth(y, m));
  const date = toLocalDate(y, m, day);
  if (date < item.startDate) return null;
  if (item.endDate && date > item.endDate) return null;
  return date;
}

/** „Obavezno”: zbroj svih aktivnih stavki koje padaju u taj mjesec (cijeli mjesec, ne samo do danas). */
export function obligatoryForMonth(items: readonly RecurringItem[], month: YearMonth): Cents {
  let total = 0;
  for (const it of items) {
    if (occurrenceDate(it, month) !== null) total += it.amountCents;
  }
  return total;
}

/** Sljedeće naplate od danas (uključujući danas) unutar tekućeg mjeseca, po datumu. */
export function upcomingInMonth(
  items: readonly RecurringItem[],
  today: LocalDate,
  limit = Infinity,
): { item: RecurringItem; date: LocalDate }[] {
  const month = today.slice(0, 7);
  const out: { item: RecurringItem; date: LocalDate }[] = [];
  for (const item of items) {
    const date = occurrenceDate(item, month);
    if (date !== null && date >= today) out.push({ item, date });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.item.name.localeCompare(b.item.name)));
  return out.slice(0, limit);
}
