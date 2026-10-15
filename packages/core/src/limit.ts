import { divRound, type Cents } from "./money";
import { daysLeftInclusive, yearMonthOf, type LocalDate } from "./dates";
import { obligatoryForMonth, type RecurringItem } from "./recurring";

/**
 * Preporučeni dnevni trošak. JEDINA definicija formule (docs/APP-PLAN.md §4.2).
 *
 *  raspoloživo   = primanja (+ neplanirani prihodi) − obavezno − štednja
 *  potrošeno     = troškovi u mjesecu BEZ source = "recurring" (pretplate su već u „obavezno”)
 *  dnevni iznos  = (raspoloživo − potrošeno prije današnjeg dana) ÷ preostali dani uključujući danas
 *  danas još     = dnevni iznos − potrošeno danas   (može biti negativno: „X € preko”)
 *
 * Zaokruživanje: dnevni iznos se zaokružuje na najbliži cent (polovina od nule).
 */
export interface LimitInput {
  incomeCents: Cents;
  /** D-09: neplanirani prihodi u mjesecu; dodaju se raspoloživom. */
  extraIncomeCents?: Cents;
  obligatoryCents: Cents;
  savingsCents: Cents;
  /** Troškovi mjeseca PRIJE današnjeg dana, bez knjiženih pretplata. */
  spentBeforeTodayCents: Cents;
  /** Današnji troškovi, bez knjiženih pretplata. */
  spentTodayCents: Cents;
  today: LocalDate;
}

export interface LimitResult {
  /** Primanja − obavezno − štednja (+ neplanirani prihodi). */
  availableCents: Cents;
  /** Preostali dani u mjesecu uključujući danas. */
  daysLeft: number;
  /** Preporučeni dnevni trošak za danas (fiksan tijekom dana). */
  dailyCents: Cents;
  /** Dnevni iznos − potrošeno danas. Negativno = preko limita. */
  leftTodayCents: Cents;
  isOver: boolean;
  /** Koliko je preko (≥ 0); 0 ako nije preko. */
  overByCents: Cents;
  /** Što je ostalo za cijeli ostatak mjeseca (raspoloživo − sve potrošeno do sad). */
  monthLeftCents: Cents;
}

export function computeDailyLimit(input: LimitInput): LimitResult {
  const available =
    input.incomeCents + (input.extraIncomeCents ?? 0) - input.obligatoryCents - input.savingsCents;
  const daysLeft = daysLeftInclusive(input.today);
  const daily = divRound(available - input.spentBeforeTodayCents, daysLeft);
  const leftToday = daily - input.spentTodayCents;
  return {
    availableCents: available,
    daysLeft,
    dailyCents: daily,
    leftTodayCents: leftToday,
    isOver: leftToday < 0,
    overByCents: leftToday < 0 ? -leftToday : 0,
    monthLeftCents: available - input.spentBeforeTodayCents - input.spentTodayCents,
  };
}

/* ---------- Sastavljanje iz transakcija ---------- */

export type TxType = "expense" | "income";
export type TxSource = "manual" | "scan" | "recurring";

export interface TxLike {
  amountCents: Cents;
  type: TxType;
  source: TxSource;
  localDate: LocalDate;
}

export interface MonthPlanLike {
  incomeCents: Cents;
  savingsCents: Cents;
}

/**
 * Izračun za početni ekran iz plana, pretplata i transakcija.
 * Troškovi s source = "recurring" se NE broje kao potrošeno (već su u „obavezno”).
 * Prihodi izvan plana (type = income) dodaju se raspoloživom (D-09).
 */
export function summarizeMonth(args: {
  plan: MonthPlanLike;
  recurring: readonly RecurringItem[];
  transactions: readonly TxLike[];
  today: LocalDate;
}): LimitResult {
  const month = yearMonthOf(args.today);
  let before = 0;
  let todaySpent = 0;
  let extraIncome = 0;
  for (const t of args.transactions) {
    if (yearMonthOf(t.localDate) !== month) continue;
    if (t.type === "income") {
      if (t.source !== "recurring") extraIncome += t.amountCents;
      continue;
    }
    if (t.source === "recurring") continue;
    if (t.localDate < args.today) before += t.amountCents;
    else if (t.localDate === args.today) todaySpent += t.amountCents;
    // troškovi s budućim datumom unutar mjeseca ne ulaze u današnji izračun
  }
  return computeDailyLimit({
    incomeCents: args.plan.incomeCents,
    extraIncomeCents: extraIncome,
    obligatoryCents: obligatoryForMonth(args.recurring, month),
    savingsCents: args.plan.savingsCents,
    spentBeforeTodayCents: before,
    spentTodayCents: todaySpent,
    today: args.today,
  });
}
