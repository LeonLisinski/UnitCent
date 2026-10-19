import { describe, expect, it } from "vitest";
import { computeFacts, eur, numbersAreSubset, type Input, type Tx } from "../../../supabase/functions/insights/facts";

const tx = (date: string, cents: number, cat = "hrana", source: Tx["source"] = "manual"): Tx => ({ amount_cents: cents, type: "expense", category_id: cat, local_date: date, source });

describe("insights facts", () => {
  it("formatira iznose hrvatski", () => {
    expect(eur(207_40)).toBe("207,40 €");
    expect(eur(123_456_78)).toBe("123.456,78 €");
  });

  it("tempo: upozorava kad se troši brže od plana", () => {
    const inp: Input = {
      today: "2026-10-10",
      month: "2026-10",
      transactions: Array.from({ length: 10 }, (_, i) => tx(`2026-10-${String(i + 1).padStart(2, "0")}`, 5000)),
      categories: [{ id: "hrana", name: "Hrana" }],
      recurring: [],
      plan: { income_cents: 100_000, savings_cents: 0 },
    };
    const pace = computeFacts(inp).find((f) => f.id === "pace")!;
    expect(pace.tone).toBe("warn");
    expect(pace.numbers).toContain(eur(50_000));
    expect(pace.numbers).toContain(eur(155_000));
  });

  it("kategorija raste u odnosu na prosjek", () => {
    const prev = Array.from({ length: 5 }, (_, i) => tx(`2026-09-${String(i + 1).padStart(2, "0")}`, 4000));
    const cur = Array.from({ length: 10 }, (_, i) => tx(`2026-10-${String(i + 1).padStart(2, "0")}`, 4000));
    const f = computeFacts({ today: "2026-10-10", month: "2026-10", transactions: [...prev, ...cur], categories: [{ id: "hrana", name: "Hrana" }], recurring: [], plan: null });
    expect(f.some((x) => x.id === "category_up")).toBe(true);
  });

  it("knjižene pretplate ne ulaze u varijabilne troškove", () => {
    const f = computeFacts({ today: "2026-10-10", month: "2026-10", transactions: [tx("2026-10-02", 90_000, "stan", "recurring")], categories: [], recurring: [], plan: null });
    expect(f.find((x) => x.id === "top_category")).toBeUndefined();
  });

  it("provjera brojki odbija izmišljene iznose", () => {
    expect(numbersAreSubset("Potrošio si 50,00 € do danas.", ["50,00 €"])).toBe(true);
    expect(numbersAreSubset("Potrošio si 70,00 € do danas.", ["50,00 €"])).toBe(false);
  });
});
