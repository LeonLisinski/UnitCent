// Niz dana s unosom („7 dana zaredom“) i trenutak za traženje ocjene. Čisto, bez sata (danas se predaje).
import { parseLocalDate, toLocalDate, type LocalDate } from "./dates";

export function addDays(date: LocalDate, n: number): LocalDate {
  const { y, m, d } = parseLocalDate(date);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toLocalDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Broj uzastopnih dana s barem jednim unosom koji završava danas, a ako danas još nema unosa, jučer
 * (niz se ne „gubi“ ujutro, prije prvog unosa). Datumi mogu biti u bilo kojem redoslijedu i ponavljati se.
 */
export function entryStreak(dates: readonly LocalDate[], today: LocalDate): number {
  const set = new Set(dates);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

/** Ciljevi niza (jedna mirna poruka na svakom). Ton: kontinuitet i bolji pregled nad novcem, bez hvaljenja. */
export const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 90, 100, 180, 365] as const;

/** Najduži niz uzastopnih dana u popisu datuma. */
export function longestStreak(dates: readonly LocalDate[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: LocalDate | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/** Sljedeći cilj iznad trenutnog niza (iza 365 svakih 100 dana). */
export function nextMilestone(n: number): number {
  for (const m of STREAK_MILESTONES) if (m > n) return m;
  return (Math.floor(n / 100) + 1) * 100;
}

/**
 * Poruka kad niz dosegne cilj (toast) ili null izvan ciljeva. Ne slavi broj, nego ono što podaci sad omogućuju
 * (kontinuitet, pregled, prepoznavanje navika). Pohvala samo jednom, na kraju godine, i to suzdržano.
 */
export function milestoneMessage(n: number): string | null {
  const msg: Record<number, string> = {
    3: "Mali koraci čine razliku.",
    5: "Sve si bliže dobroj navici.",
    7: "Prvi tjedan je iza tebe.",
    10: "Svaki unos daje ti jasniju sliku troškova.",
    14: "Dva tjedna praćenja. Samo nastavi.",
    21: "Praćenje troškova postaje rutina.",
    30: "30 dana praćenja. Vrijeme je da pogledaš svoje navike.",
    50: "Već imaš dobar uvid u svoje navike trošenja.",
    90: "Tri mjeseca podataka. Što se promijenilo?",
    100: "100 dana kontinuiteta. To je ozbiljna baza podataka.",
    180: "Pola godine praćenja. Tvoji podaci pričaju priču.",
    365: "Cijela godina tvojih troškova. Sad imaš širu sliku svojih financija.",
  };
  return msg[n] ?? null;
}

/** Jedna rečenica uz niz na Početnoj (list niza): kratko i korisno, bez krivnje. */
export function streakNudge(n: number, enteredToday: boolean): string {
  if (enteredToday) return "Sve je zabilježeno. Vidimo se sutra.";
  if (n > 0) return "Tvoj niz čeka današnji unos.";
  return "Upisom današnjih troškova počinješ niz.";
}

/** Večernji podsjetnik (20:30) kad danas još nema unosa: tri slučaja prema nizu. */
export function eveningReminder(n: number): { title: string; body: string } {
  if (n >= 3) return { title: "Nastavi svoj niz", body: "Zabilježi današnje troškove i nastavi gdje si stao." };
  if (n > 0) return { title: "Vrijeme je za današnji pregled", body: "Još nisi zabilježio današnje troškove." };
  return { title: "Ne zaboravi današnje troškove", body: "Zabilježi ih sada i zadrži pregled nad svojim novcem." };
}

/** Hrvatska množina: 1 dan, 2 do 4 dana, 5+ dana (11 do 14 su „mnogo“). */
export function pluralHr(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
}

/** „7 dana zaredom“, „21 dan zaredom“. */
export const streakLabel = (n: number): string => `${n} ${pluralHr(n, "dan", "dana", "dana")} zaredom`;

export interface ReviewGate {
  /** Prvi dan s unosom (koliko dugo korisnik koristi aplikaciju). */
  firstEntry: LocalDate | null;
  totalEntries: number;
  /** Zadnji put kad je ocjena zatražena (ili null). */
  lastAsked: LocalDate | null;
  timesAsked: number;
}

/**
 * Smije li se sada zatražiti ocjena: samo nakon trenutka zadovoljstva (poziva aplikacija), i to kad korisnik
 * koristi aplikaciju najmanje 7 dana i ima najmanje 10 unosa, najviše jednom u 120 dana i najviše 3 puta ukupno.
 */
export function canAskForReview(g: ReviewGate, today: LocalDate): boolean {
  if (!g.firstEntry || g.totalEntries < 10 || g.timesAsked >= 3) return false;
  if (addDays(g.firstEntry, 7) > today) return false;
  if (g.lastAsked && addDays(g.lastAsked, 120) > today) return false;
  return true;
}
