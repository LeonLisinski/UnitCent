import { describe, expect, it } from "vitest";
import { computeDailyLimit, savingsForMonth } from "../src";

describe("savingsForMonth", () => {
  it("bez potvrde vrijedi planirana štednja", () => {
    expect(savingsForMonth(20_000, null)).toBe(20_000);
    expect(savingsForMonth(20_000, undefined)).toBe(20_000);
  });
  it("potvrđeni iznos zamjenjuje plan, i kad je 0", () => {
    expect(savingsForMonth(20_000, 0)).toBe(0);
    expect(savingsForMonth(20_000, 25_000)).toBe(25_000);
  });
  it("potvrda „ništa“ vraća planiranu štednju u iznos za trošenje", () => {
    const base = { incomeCents: 146_800, obligatoryCents: 77_133, spentBeforeTodayCents: 0, spentTodayCents: 0, today: "2026-10-21" as const };
    const planned = computeDailyLimit({ ...base, savingsCents: savingsForMonth(15_000, null) });
    const none = computeDailyLimit({ ...base, savingsCents: savingsForMonth(15_000, 0) });
    expect(none.availableCents - planned.availableCents).toBe(15_000);
  });
});
