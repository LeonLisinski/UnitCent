import { divRound, type Cents } from "./money";
import { daysLeftInclusive, yearMonthOf, type LocalDate } from "./dates";
import { obligatoryForMonth, occurrenceDate, type RecurringItem } from "./recurring";

/**
 * Preporučeni dnevni trošak. JEDINA definicija formule (docs/APP-PLAN.md §4.2).
 *
 *  raspoloživo   = primanja (+ neplanirani prihodi) − obavezno − štednja (potvrđena za mjesec, inače planirana: savingsForMonth)
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
  /**
   * D-13: potrošeno u tom mjesecu prije početka praćenja (npr. aplikacija instalirana 14.).
   * Ulazi u „potrošeno prije današnjeg dana“, kao da su ti troškovi uneseni. Vrijedi samo za mjesec plana.
   */
  spentBeforeCents?: Cents;
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
  let before = args.plan.spentBeforeCents ?? 0;
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

/**
 * D-13: početak usred mjeseca. Iz stanja na računu procjenjuje koliko je u mjesecu već potrošeno, da se stari troškovi
 * ne moraju unositi. Pretpostavka: primanja su sjela, plaćene pretplate su izašle s računa, a štednja još nije prebačena.
 *
 *  potrošeno prije = primanja − pretplate plaćene prije danas − stanje na računu   (nikad manje od 0)
 */
export function spentBeforeFromBalance(args: {
  incomeCents: Cents;
  recurring: readonly RecurringItem[];
  balanceCents: Cents;
  today: LocalDate;
}): Cents {
  const month = yearMonthOf(args.today);
  let paid = 0;
  for (const it of args.recurring) {
    const d = occurrenceDate(it, month);
    if (d !== null && d < args.today) paid += it.amountCents;
  }
  return Math.max(0, args.incomeCents - paid - args.balanceCents);
}

/* ---------- „Mogu li si priuštiti?“ ---------- */

export interface AffordResult {
  /** Ostalo za danas nakon kupnje (negativno = „Danas preko“). */
  leftTodayCents: Cents;
  /** Ostalo za ostatak mjeseca nakon kupnje (negativno = mjesec preko plana). */
  monthLeftCents: Cents;
  /** Dnevni budžet od sutra nakon kupnje (ista formula, za sutrašnji dan); null zadnji dan mjeseca. */
  tomorrowDailyCents: Cents | null;
  /** Stane li u današnji dnevni budžet. */
  fitsToday: boolean;
  /** Stane li u ostatak mjeseca. */
  fitsMonth: boolean;
}

/**
 * Što se događa ako danas potrošiš `amount`. Sutrašnji dnevni budžet je ista formula kao gore:
 * (raspoloživo − potrošeno prije sutra) ÷ preostali dani od sutra = (ostatak mjeseca − iznos) ÷ (dani − 1).
 */
export function checkAfford(limit: LimitResult, amountCents: Cents): AffordResult {
  const leftToday = limit.leftTodayCents - amountCents;
  const monthLeft = limit.monthLeftCents - amountCents;
  const restDays = limit.daysLeft - 1;
  return {
    leftTodayCents: leftToday,
    monthLeftCents: monthLeft,
    tomorrowDailyCents: restDays > 0 ? divRound(monthLeft, restDays) : null,
    fitsToday: leftToday >= 0,
    fitsMonth: monthLeft >= 0,
  };
}

/**
 * Štednja koja ulazi u formulu za mjesec: potvrđeni iznos („ovaj mjesec prebacio sam X €“) kad postoji,
 * inače planirani. Tko potvrdi da ovaj mjesec ne štedi (0 €), dobiva taj iznos natrag za trošenje.
 */
export function savingsForMonth(plannedCents: Cents, confirmedCents: Cents | null | undefined): Cents {
  return confirmedCents ?? plannedCents;
}
