import { describe, expect, it } from "vitest";
import { answer, fillPlaceholders, type RecurringNamed } from "../../../supabase/functions/advisor/answers";
import { eur, numbersAreSubset, type Input, type Tx } from "../../../supabase/functions/insights/facts";

const tx = (date: string, cents: number, cat: string): Tx => ({ amount_cents: cents, type: "expense", category_id: cat, local_date: date, source: "manual" });
const base: Input = {
  today: "2026-10-15",
  month: "2026-10",
  transactions: [tx("2026-10-02", 6000, "hrana"), tx("2026-10-05", 4000, "hrana"), tx("2026-10-07", 3000, "auto"), tx("2026-10-09", 1000, "zabava"), tx("2026-10-20", 9900, "auto")],
  categories: [
    { id: "hrana", name: "Hrana" },
    { id: "auto", name: "Auto" },
    { id: "zabava", name: "Zabava" },
  ],
  recurring: [],
  plan: { income_cents: 146_800, savings_cents: 15_000 },
};
const subs: RecurringNamed[] = [
  { name: "Netflix", amount_cents: 1399, day_of_month: 5, start_date: "2026-01-01", end_date: null, active: true },
  { name: "Kredit", amount_cents: 45_000, day_of_month: 1, start_date: "2026-01-01", end_date: null, active: true },
  { name: "Stara", amount_cents: 999, day_of_month: 1, start_date: "2026-01-01", end_date: "2026-05-01", active: true },
];

describe("AI savjetnik", () => {
  it("gdje mi najviše ide: kategorije do danas (budući datum ne ulazi)", () => {
    const a = answer("where", base, []);
    expect(a.rows.map((r) => r.label)).toEqual(["Hrana", "Auto", "Zabava"]);
    expect(a.rows[0]!.cents).toBe(10_000);
    expect(a.body).toContain(eur(10_000));
    expect(a.body).toContain("71 %");
    expect(numbersAreSubset(a.body, a.numbers)).toBe(true);
  });

  it("pretplate: imena ne idu modelu, samo oznaka; završene se ne broje", () => {
    const a = answer("subs", base, subs);
    expect(a.body).not.toContain("Kredit");
    expect(a.body).toContain("{A}");
    expect(a.placeholders["{A}"]).toBe("Kredit");
    expect(a.numbers).toContain(eur(46_399));
    expect(a.rows.map((r) => r.label)).toEqual(["Kredit", "Netflix"]);
    expect(numbersAreSubset(a.body, a.numbers)).toBe(true);
    expect(fillPlaceholders(a.body, a.placeholders)).toContain("Kredit");
  });

  it("oznaka koju je model izgubio odbacuje tekst", () => {
    expect(fillPlaceholders("Najveća je stavka 450,00 €.", { "{A}": "Kredit" })).toBeNull();
  });

  it("bez podataka: objašnjenje, ne troši kvotu", () => {
    const a = answer("where", { ...base, transactions: [] }, []);
    expect(a.empty).toBe(true);
    expect(answer("subs", base, []).empty).toBe(true);
  });

  it("kraj mjeseca: tempo iz istih činjenica kao uvidi", () => {
    const a = answer("month_end", base, []);
    expect(a.empty).toBe(false);
    expect(numbersAreSubset(a.body, a.numbers)).toBe(true);
  });
});
