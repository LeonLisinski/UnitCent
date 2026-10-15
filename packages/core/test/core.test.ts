import { describe, expect, it } from "vitest";
import {
  computeDailyLimit,
  daysInMonth,
  daysLeftInclusive,
  divRound,
  formatEur,
  obligatoryForMonth,
  occurrenceDate,
  parseAmount,
  summarizeMonth,
  upcomingInMonth,
  type RecurringItem,
} from "../src";

const NBSP = " ";
const MINUS = "−";

/* Primjer plana iz weba i dokumentacije (CLAUDE.md): sve u centima. */
const PLAN = { incomeCents: 146_800, savingsCents: 15_000 };
const OBLIGATORY = 77_133;

describe("novac", () => {
  it("parsira hrvatske i engleske unose", () => {
    expect(parseAmount("12,50")).toBe(1250);
    expect(parseAmount("12.5")).toBe(1250);
    expect(parseAmount("12")).toBe(1200);
    expect(parseAmount("0,5")).toBe(50);
    expect(parseAmount("1.234,56")).toBe(123_456);
    expect(parseAmount("1,234.56")).toBe(123_456);
    expect(parseAmount("1.234")).toBe(123_400); // tisućice, ne decimale
    expect(parseAmount(`1${NBSP}234,56`)).toBe(123_456);
  });

  it("odbija nevaljane unose", () => {
    for (const bad of ["", "abc", "-5", "12,345,6", "1,,2", "12.", ".5", "1e3"]) {
      expect(parseAmount(bad), bad).toBeNull();
    }
  });

  it("formatira po hrvatskom standardu", () => {
    expect(formatEur(123_456)).toBe(`1.234,56${NBSP}€`);
    expect(formatEur(5)).toBe(`0,05${NBSP}€`);
    expect(formatEur(0)).toBe(`0,00${NBSP}€`);
    expect(formatEur(-2350)).toBe(`${MINUS}23,50${NBSP}€`);
    expect(formatEur(100_000_000)).toBe(`1.000.000,00${NBSP}€`);
    expect(formatEur(1250, { sign: true })).toBe(`+12,50${NBSP}€`);
  });

  it("dijeli i zaokružuje na cent (polovina od nule)", () => {
    expect(divRound(33_927, 17)).toBe(1996); // 1995,76…
    expect(divRound(5, 2)).toBe(3);
    expect(divRound(-5, 2)).toBe(-3);
    expect(() => divRound(100, 0)).toThrow();
  });
});

describe("datumi", () => {
  it("broj dana u mjesecu (28/29/30/31)", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28); // 2100 nije prijestupna
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(31);
  });

  it("preostali dani uključuju današnji", () => {
    expect(daysLeftInclusive("2026-10-01")).toBe(31);
    expect(daysLeftInclusive("2026-10-15")).toBe(17);
    expect(daysLeftInclusive("2026-10-31")).toBe(1);
    expect(daysLeftInclusive("2026-02-28")).toBe(1);
    expect(daysLeftInclusive("2028-02-28")).toBe(2);
  });

  it("odbija nepostojeće datume", () => {
    expect(() => daysLeftInclusive("2026-02-30")).toThrow();
    expect(() => daysLeftInclusive("2026-13-01")).toThrow();
    expect(() => daysLeftInclusive("nije")).toThrow();
  });
});

describe("ponavljajuće stavke", () => {
  const base: RecurringItem = {
    id: "r1",
    name: "Teretana",
    amountCents: 2650,
    dayOfMonth: 12,
    active: true,
    startDate: "2026-01-01",
  };

  it("dan 31 u kraćim mjesecima pada na zadnji dan", () => {
    const it31 = { ...base, dayOfMonth: 31 };
    expect(occurrenceDate(it31, "2026-02")).toBe("2026-02-28");
    expect(occurrenceDate(it31, "2028-02")).toBe("2028-02-29");
    expect(occurrenceDate(it31, "2026-04")).toBe("2026-04-30");
    expect(occurrenceDate(it31, "2026-10")).toBe("2026-10-31");
  });

  it("poštuje početak, kraj i aktivnost", () => {
    expect(occurrenceDate({ ...base, startDate: "2026-10-13" }, "2026-10")).toBeNull(); // 12. prije početka
    expect(occurrenceDate({ ...base, startDate: "2026-10-12" }, "2026-10")).toBe("2026-10-12");
    expect(occurrenceDate({ ...base, endDate: "2026-09-30" }, "2026-10")).toBeNull();
    expect(occurrenceDate({ ...base, endDate: "2026-10-12" }, "2026-10")).toBe("2026-10-12");
    expect(occurrenceDate({ ...base, active: false }, "2026-10")).toBeNull();
    expect(occurrenceDate({ ...base, dayOfMonth: 0 }, "2026-10")).toBeNull();
  });

  it("zbraja obavezno samo za mjesec u kojem vrijede", () => {
    const items: RecurringItem[] = [
      base,
      { ...base, id: "r2", name: "Kredit", amountCents: 38_067, dayOfMonth: 5 },
      { ...base, id: "r3", name: "Staro", amountCents: 9999, endDate: "2026-06-30" },
    ];
    expect(obligatoryForMonth(items, "2026-10")).toBe(2650 + 38_067);
  });

  it("sljedeće naplate poredane po danu", () => {
    const items: RecurringItem[] = [
      { ...base, id: "a", name: "A", dayOfMonth: 20 },
      { ...base, id: "b", name: "B", dayOfMonth: 15 },
      { ...base, id: "c", name: "C", dayOfMonth: 3 },
    ];
    const up = upcomingInMonth(items, "2026-10-15");
    expect(up.map((u) => u.item.name)).toEqual(["B", "A"]); // "C" je već prošla, "B" je danas
  });
});

describe("dnevni limit", () => {
  const input = {
    ...PLAN,
    obligatoryCents: OBLIGATORY,
    spentBeforeTodayCents: 20_740,
    spentTodayCents: 0,
    today: "2026-10-15",
  };

  it("primjer s weba: 19,96 €", () => {
    const r = computeDailyLimit(input);
    expect(r.availableCents).toBe(54_667);
    expect(r.daysLeft).toBe(17);
    expect(r.dailyCents).toBe(1996);
    expect(r.leftTodayCents).toBe(1996);
    expect(r.isOver).toBe(false);
    expect(r.monthLeftCents).toBe(33_927);
  });

  it("današnja potrošnja smanjuje današnji broj točno za svoj iznos", () => {
    const r = computeDailyLimit({ ...input, spentTodayCents: 1000 });
    expect(r.dailyCents).toBe(1996); // dnevni iznos je fiksan tijekom dana
    expect(r.leftTodayCents).toBe(996);
    expect(r.monthLeftCents).toBe(33_927 - 1000);
  });

  it("prekoračenje je negativno i označeno, nikad 0", () => {
    const r = computeDailyLimit({ ...input, spentTodayCents: 3000 });
    expect(r.leftTodayCents).toBe(-1004);
    expect(r.isOver).toBe(true);
    expect(r.overByCents).toBe(1004);
  });

  it("sutra se limit preračuna s jučerašnjom potrošnjom", () => {
    const r = computeDailyLimit({
      ...input,
      today: "2026-10-16",
      spentBeforeTodayCents: 20_740 + 3000,
    });
    expect(r.daysLeft).toBe(16);
    expect(r.dailyCents).toBe(divRound(54_667 - 23_740, 16));
  });

  it("zadnji dan mjeseca: sve što je ostalo", () => {
    const r = computeDailyLimit({ ...input, today: "2026-10-31", spentBeforeTodayCents: 50_000 });
    expect(r.daysLeft).toBe(1);
    expect(r.dailyCents).toBe(4667);
  });

  it("radi u mjesecima s 28, 29, 30 i 31 dan", () => {
    const base = { ...input, spentBeforeTodayCents: 0 };
    expect(computeDailyLimit({ ...base, today: "2026-02-01" }).daysLeft).toBe(28);
    expect(computeDailyLimit({ ...base, today: "2028-02-01" }).daysLeft).toBe(29);
    expect(computeDailyLimit({ ...base, today: "2026-04-01" }).daysLeft).toBe(30);
    expect(computeDailyLimit({ ...base, today: "2026-01-01" }).daysLeft).toBe(31);
  });

  it("negativno raspoloživo (obaveze veće od primanja) ostaje negativno", () => {
    const r = computeDailyLimit({
      incomeCents: 50_000,
      obligatoryCents: 60_000,
      savingsCents: 0,
      spentBeforeTodayCents: 0,
      spentTodayCents: 0,
      today: "2026-10-22",
    });
    expect(r.availableCents).toBe(-10_000);
    expect(r.daysLeft).toBe(10);
    expect(r.dailyCents).toBe(-1000);
    expect(r.isOver).toBe(true);
  });

  it("neplanirani prihodi se dodaju raspoloživom (D-09)", () => {
    const r = computeDailyLimit({ ...input, extraIncomeCents: 10_000 });
    expect(r.availableCents).toBe(64_667);
  });
});

describe("sastavljanje iz transakcija", () => {
  const recurring: RecurringItem[] = [
    { id: "k", name: "Kredit", amountCents: 38_067, dayOfMonth: 5, active: true, startDate: "2026-01-01" },
    { id: "s", name: "Spotify", amountCents: 1250, dayOfMonth: 10, active: true, startDate: "2026-01-01" },
  ];
  const plan = { incomeCents: 146_800, savingsCents: 15_000 };
  const today = "2026-10-15";

  it("knjižena pretplata ne smanjuje limit dvaput", () => {
    const manual = [
      { amountCents: 2000, type: "expense", source: "manual", localDate: "2026-10-12" },
      { amountCents: 500, type: "expense", source: "scan", localDate: "2026-10-14" },
    ] as const;
    const booked = [
      { amountCents: 38_067, type: "expense", source: "recurring", localDate: "2026-10-05" },
      { amountCents: 1250, type: "expense", source: "recurring", localDate: "2026-10-10" },
    ] as const;

    const without = summarizeMonth({ plan, recurring, transactions: [...manual], today });
    const withBooked = summarizeMonth({ plan, recurring, transactions: [...manual, ...booked], today });
    expect(withBooked).toEqual(without);
    expect(without.availableCents).toBe(146_800 - (38_067 + 1250) - 15_000);
  });

  it("ignorira transakcije drugih mjeseci i buduće dane", () => {
    const r = summarizeMonth({
      plan,
      recurring: [],
      today,
      transactions: [
        { amountCents: 9999, type: "expense", source: "manual", localDate: "2026-09-30" },
        { amountCents: 7777, type: "expense", source: "manual", localDate: "2026-10-20" },
        { amountCents: 1000, type: "expense", source: "manual", localDate: "2026-10-01" },
        { amountCents: 400, type: "expense", source: "manual", localDate: "2026-10-15" },
      ],
    });
    expect(r.monthLeftCents).toBe(146_800 - 15_000 - 1000 - 400);
    expect(r.leftTodayCents).toBe(r.dailyCents - 400);
  });

  it("prihod izvan plana povećava raspoloživo", () => {
    const r = summarizeMonth({
      plan,
      recurring: [],
      today,
      transactions: [{ amountCents: 5000, type: "income", source: "manual", localDate: "2026-10-03" }],
    });
    expect(r.availableCents).toBe(146_800 - 15_000 + 5000);
  });
});
