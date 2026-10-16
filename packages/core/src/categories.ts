import type { Cents } from "./money";
import type { LocalDate } from "./dates";
import { yearMonthOf, type YearMonth } from "./dates";

/** Zadane kategorije (korisnik ih može mijenjati). `colorToken` je ključ iz @unitcent/tokens. */
export interface DefaultCategory {
  key: string;
  name: string;
  icon: string;
  colorToken: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { key: "hrana", name: "Hrana", icon: "cart", colorToken: "cat-hrana" },
  { key: "auto", name: "Auto", icon: "car", colorToken: "cat-auto" },
  { key: "stan", name: "Stan i režije", icon: "house", colorToken: "cat-stan" },
  { key: "zabava", name: "Zabava", icon: "glass", colorToken: "cat-zabava" },
  { key: "zdravlje", name: "Zdravlje", icon: "heart", colorToken: "cat-zdravlje" },
  { key: "pretplate", name: "Pretplate", icon: "repeat", colorToken: "cat-pretplate" },
  { key: "cigarete", name: "Cigarete", icon: "smoke", colorToken: "cat-cigarete" },
  { key: "obitelj", name: "Obitelj i pokloni", icon: "gift", colorToken: "cat-obitelj" },
  { key: "ostalo", name: "Ostalo", icon: "dots", colorToken: "cat-ostalo" },
] as const;

/** Popularne pretplate i fiksni troškovi za onboarding (iznosi su prijedlog, korisnik ih mijenja). */
export interface PopularRecurring {
  key: string;
  name: string;
  suggestedCents: Cents;
  dayOfMonth: number;
  categoryKey: string;
  icon: string;
}

export const POPULAR_RECURRING: readonly PopularRecurring[] = [
  { key: "najam", name: "Najam", suggestedCents: 0, dayOfMonth: 1, categoryKey: "stan", icon: "house" },
  { key: "kredit", name: "Kredit", suggestedCents: 0, dayOfMonth: 5, categoryKey: "stan", icon: "card" },
  { key: "rezije", name: "Režije", suggestedCents: 0, dayOfMonth: 15, categoryKey: "stan", icon: "drop" },
  { key: "mobitel", name: "Mobitel", suggestedCents: 0, dayOfMonth: 10, categoryKey: "pretplate", icon: "phone" },
  { key: "internet", name: "Internet", suggestedCents: 0, dayOfMonth: 10, categoryKey: "pretplate", icon: "wifi" },
  { key: "netflix", name: "Netflix", suggestedCents: 1399, dayOfMonth: 12, categoryKey: "pretplate", icon: "play" },
  { key: "spotify", name: "Spotify", suggestedCents: 1249, dayOfMonth: 5, categoryKey: "pretplate", icon: "music" },
  { key: "teretana", name: "Teretana", suggestedCents: 0, dayOfMonth: 1, categoryKey: "zdravlje", icon: "dumbbell" },
  { key: "osiguranje", name: "Osiguranje", suggestedCents: 0, dayOfMonth: 20, categoryKey: "auto", icon: "shield" },
] as const;

/* ---------- Agregacije za pregled ---------- */

export interface TxForStats {
  amountCents: Cents;
  type: "expense" | "income";
  categoryId: string | null;
  localDate: LocalDate;
}

/** Zbroj troškova po kategoriji u mjesecu (prihodi se ne računaju). Ključ `null` = bez kategorije. */
export function totalsByCategory(
  txs: readonly TxForStats[],
  month: YearMonth,
): { categoryId: string | null; totalCents: Cents }[] {
  const map = new Map<string | null, number>();
  for (const t of txs) {
    if (t.type !== "expense" || yearMonthOf(t.localDate) !== month) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountCents);
  }
  return [...map.entries()]
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Ukupni troškovi u mjesecu. */
export function monthExpenseTotal(txs: readonly TxForStats[], month: YearMonth): Cents {
  let t = 0;
  for (const x of txs) if (x.type === "expense" && yearMonthOf(x.localDate) === month) t += x.amountCents;
  return t;
}

/** Prethodni mjesec ("2026-01" → "2025-12"). */
export function previousMonth(month: YearMonth): YearMonth {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Promjena u postocima u odnosu na prošli mjesec; null ako nema usporedbe (prošlo = 0). */
export function percentChange(current: Cents, previous: Cents): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
