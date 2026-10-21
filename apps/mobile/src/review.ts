import { canAskForReview, type LocalDate } from "@unitcent/core";
import type * as SR from "expo-store-review";
import { track } from "./analytics";
import { entryStats, kvGet, kvSet } from "./db/repo";

// Kao kod zaključavanja: u buildu bez nativnog modula (stari EAS build, Expo Go) ocjena se samo preskače.
let StoreReview: typeof SR | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  StoreReview = require("expo-store-review") as typeof SR;
} catch {
  StoreReview = null;
}

/**
 * Traži ocjenu u trgovini, ali samo kad je pozvana iz trenutka zadovoljstva (dan ili mjesec ispod plana; ne uz poruke
 * o nizu, da ne prekida trenutak napretka) i kad to dopušta `canAskForReview` (7+ dana korištenja, 10+ unosa, najviše jednom u 120 dana, 3 puta).
 * Sistemski prozor sam odlučuje hoće li se pokazati (Apple: najviše 3 puta godišnje); nikad na pritisak gumba.
 */
export async function maybeAskForReview(todayDate: LocalDate, reason: string): Promise<void> {
  if (!StoreReview) return;
  try {
    const stats = entryStats(todayDate);
    const gate = {
      firstEntry: stats.firstEntry,
      totalEntries: stats.totalEntries,
      lastAsked: kvGet("review.last"),
      timesAsked: Number(kvGet("review.count") ?? "0") || 0,
    };
    if (!canAskForReview(gate, todayDate)) return;
    if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
    kvSet("review.last", todayDate);
    kvSet("review.count", String(gate.timesAsked + 1));
    track("review_requested", { reason });
    await StoreReview.requestReview();
  } catch {
    /* ocjena nikad ne smije srušiti ekran */
  }
}
