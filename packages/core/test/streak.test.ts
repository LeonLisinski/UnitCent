import { describe, expect, it } from "vitest";
import { STREAK_MILESTONES, addDays, canAskForReview, entryStreak, eveningReminder, longestStreak, milestoneMessage, nextMilestone, pluralHr, streakLabel, streakNudge } from "../src";

describe("niz dana s unosom", () => {
  it("broji do danas ili do jučer ako danas još nema unosa", () => {
    const d = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-21", "2026-10-17"];
    expect(entryStreak(d, "2026-10-21")).toBe(3);
    expect(entryStreak(d, "2026-10-22")).toBe(3); // danas još ništa, niz živi
    expect(entryStreak(d, "2026-10-23")).toBe(0); // jučer bez unosa: novi niz
    expect(entryStreak([], "2026-10-21")).toBe(0);
  });

  it("prelazi granicu mjeseca i godine", () => {
    expect(entryStreak(["2026-12-30", "2026-12-31", "2027-01-01"], "2027-01-01")).toBe(3);
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("hrvatska množina", () => {
    expect([1, 2, 5, 11, 21, 22, 25, 112].map((n) => pluralHr(n, "dan", "dana", "dana"))).toEqual(["dan", "dana", "dana", "dana", "dan", "dana", "dana", "dana"]);
    expect(streakLabel(7)).toBe("7 dana zaredom");
    expect(streakLabel(21)).toBe("21 dan zaredom");
  });
});

describe("traženje ocjene", () => {
  const base = { firstEntry: "2026-10-01", totalEntries: 25, lastAsked: null, timesAsked: 0 };
  it("tek nakon 7 dana i 10 unosa", () => {
    expect(canAskForReview(base, "2026-10-21")).toBe(true);
    expect(canAskForReview({ ...base, firstEntry: "2026-10-18" }, "2026-10-21")).toBe(false);
    expect(canAskForReview({ ...base, totalEntries: 9 }, "2026-10-21")).toBe(false);
    expect(canAskForReview({ ...base, firstEntry: null }, "2026-10-21")).toBe(false);
  });
  it("najviše jednom u 120 dana i 3 puta ukupno", () => {
    expect(canAskForReview({ ...base, lastAsked: "2026-08-01", timesAsked: 1 }, "2026-10-21")).toBe(false);
    expect(canAskForReview({ ...base, lastAsked: "2026-06-01", timesAsked: 1 }, "2026-10-21")).toBe(true);
    expect(canAskForReview({ ...base, timesAsked: 3 }, "2026-10-21")).toBe(false);
  });
});

describe("lov na niz", () => {
  it("najduži niz i sljedeći cilj", () => {
    expect(longestStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-06", "2026-10-02"])).toBe(3);
    expect(longestStreak([])).toBe(0);
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(7)).toBe(10);
    expect(nextMilestone(100)).toBe(180);
    expect(nextMilestone(365)).toBe(400);
  });
  it("mirne poruke: kontinuitet i pregled, bez hvaljenja", () => {
    expect(milestoneMessage(7)).toBe("Prvi tjedan je iza tebe.");
    expect(milestoneMessage(22)).toBeNull();
    expect(streakNudge(6, false)).toBe("Tvoj niz čeka današnji unos.");
    expect(streakNudge(6, true)).toBe("Sve je zabilježeno. Vidimo se sutra.");
    expect(eveningReminder(7).title).toBe("Nastavi svoj niz");
    expect(eveningReminder(1).title).toBe("Vrijeme je za današnji pregled");
    expect(eveningReminder(0).title).toBe("Ne zaboravi današnje troškove");
    for (const n of STREAK_MILESTONES) {
      const m = milestoneMessage(n);
      expect(m).not.toBeNull();
      expect(m!.toLowerCase()).not.toMatch(/osud|krivn|izgubi|bravo|svaka čast|rijetko tko|legenda|impresivno/);
    }
    expect(eveningReminder(0).body).not.toMatch(/sekund/);
  });
});
