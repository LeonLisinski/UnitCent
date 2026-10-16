import type { LocalDate } from "@unitcent/core";

const MONTHS_SHORT = ["sij", "velj", "ožu", "tra", "svi", "lip", "srp", "kol", "ruj", "lis", "stu", "pro"];
const MONTHS_LONG = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];
const WEEKDAYS = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];

function parts(d: LocalDate) {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  return { y, m, day };
}

/** "Danas", "Jučer" ili "12. lis". */
export function relativeDay(date: LocalDate, todayDate: LocalDate): string {
  if (date === todayDate) return "Danas";
  const t = parts(todayDate);
  const yesterday = new Date(Date.UTC(t.y, t.m - 1, t.day - 1)).toISOString().slice(0, 10);
  if (date === yesterday) return "Jučer";
  const p = parts(date);
  return `${p.day}. ${MONTHS_SHORT[p.m - 1]}`;
}

export function monthTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return `${MONTHS_LONG[m - 1]} ${y}.`;
}

/** "Četvrtak, 15. listopada" za pozdrav na početnom ekranu. */
export function longDate(date: LocalDate): string {
  const p = parts(date);
  const wd = WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.day)).getUTCDay()]!;
  const genitive = [
    "siječnja", "veljače", "ožujka", "travnja", "svibnja", "lipnja",
    "srpnja", "kolovoza", "rujna", "listopada", "studenoga", "prosinca",
  ][p.m - 1]!;
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${p.day}. ${genitive}`;
}

/** Dan u tjednu s ponedjeljkom kao 0 za prvi dan mjeseca. */
export function firstWeekdayMondayIndex(y: number, m: number): number {
  const sun0 = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return (sun0 + 6) % 7;
}

/** Kratki naziv mjeseca za "YYYY-MM" (npr. "rujan" → "ruj"). */
export function monthShort(ym: string): string {
  const m = Number(ym.split("-")[1]);
  return MONTHS_SHORT[m - 1] ?? "";
}

/**
 * Veličina fonta da se broj (npr. "10.000,00 €") sigurno stane u zadanu širinu.
 * Procjena širine po znaku za Manrope ExtraBold s tabličnim znamenkama; nikad veće od `base`.
 */
export function fitFontSize(text: string, maxWidth: number, base: number, min = 18): number {
  let em = 0;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") em += 0.64;
    else if (ch === "," || ch === "." || ch === " " || ch === "\u00a0") em += 0.3;
    else if (ch === "\u2212" || ch === "-" || ch === "+") em += 0.55;
    else em += 0.7; // €, slova
  }
  if (em === 0) return base;
  return Math.max(min, Math.min(base, Math.floor(maxWidth / em)));
}
