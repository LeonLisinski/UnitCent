import { formatEur, parseLocalDate, toLocalDate, type LocalDate } from "@unitcent/core";
import { monthTitle } from "./format";
import { getMonthSummary, kvGet, kvSet, listTransactionsInMonth } from "./db/repo";

/** Dan prije (lokalni datum). */
function dayBefore(d: LocalDate): LocalDate {
  const { y, m, d: day } = parseLocalDate(d);
  const t = new Date(Date.UTC(y, m - 1, day - 1));
  return toLocalDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export type Recap = { text: string; good: boolean };

/**
 * Kratak „kraj“ prošlog razdoblja pri prvom otvaranju dana (pravilo vrhunca i kraja), najviše jednom dnevno:
 *  - 1. u mjesecu: prošli mjesec, činjenično („Listopad: 48,00 € ispod plana“ ili „… preko plana“);
 *  - inače: jučer, samo kad je dan završio unutar dnevnog budžeta.
 * Traži plan i barem jedan unos u tom razdoblju, da poruka ne dolazi korisniku koji nije ništa pratio.
 */
export function takeRecap(todayDate: LocalDate): Recap | null {
  if (kvGet("recap.shown") === todayDate) return null;
  const yesterday = dayBefore(todayDate);
  const firstOfMonth = todayDate.endsWith("-01");
  const txs = listTransactionsInMonth(yesterday.slice(0, 7)).filter((t) => t.type === "expense" && t.source !== "recurring");
  const active = firstOfMonth ? txs.length > 0 : txs.some((t) => t.localDate === yesterday);
  if (!active) return null;
  const { limit, plan } = getMonthSummary(yesterday);
  if (!plan || plan.incomeCents <= 0) return null;

  let recap: Recap | null = null;
  if (firstOfMonth) {
    const name = monthTitle(yesterday.slice(0, 7)).replace(/\s*\d{4}\.?$/, "").replace(/\.$/, "");
    const left = limit.monthLeftCents;
    recap = left >= 0 ? { text: `${name}: ${formatEur(left)} ispod plana`, good: true } : { text: `${name}: ${formatEur(-left)} preko plana`, good: false };
  } else if (!limit.isOver && limit.leftTodayCents > 0) {
    recap = { text: `Jučer: ${formatEur(limit.leftTodayCents)} ispod plana`, good: true };
  }
  if (!recap) kvSet("recap.shown", todayDate); // nema poruke: ne računaj ponovno danas
  return recap;
}

/** Poziva se kad je poruka stvarno prikazana. */
export function markRecapShown(todayDate: LocalDate): void {
  kvSet("recap.shown", todayDate);
}
