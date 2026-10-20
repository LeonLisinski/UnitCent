import { describe, expect, it } from "vitest";
import {
  bookingId,
  DEFAULT_CATEGORIES,
  monthExpenseTotal,
  percentChange,
  previousMonth,
  totalsByCategory,
  uuidV5,
  uuidV7,
} from "../src";

const DNS_NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("ID-evi", () => {
  it("UUID v5 odgovara poznatom testnom vektoru (RFC/Python)", () => {
    expect(uuidV5("python.org", DNS_NS)).toBe("886313e1-3b8a-5372-9b90-0c9aee199e5d");
    expect(uuidV5("www.example.com", DNS_NS)).toBe("2ed6657d-e927-568b-95e1-2665a8aea6a2");
  });

  it("knjiženje pretplate ima isti ID za istu stavku i dan, a različit za druge", () => {
    const a = bookingId("11111111-1111-4111-8111-111111111111", "2026-10-05");
    expect(bookingId("11111111-1111-4111-8111-111111111111", "2026-10-05")).toBe(a);
    expect(bookingId("11111111-1111-4111-8111-111111111111", "2026-11-05")).not.toBe(a);
    expect(bookingId("22222222-2222-4222-8222-222222222222", "2026-10-05")).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("UUID v7 ima ispravan oblik i raste s vremenom", () => {
    const rnd = (n: number) => new Uint8Array(n).fill(0xab);
    const a = uuidV7(1_760_000_000_000, rnd);
    const b = uuidV7(1_760_000_000_001, rnd);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a < b).toBe(true);
    // vrijeme je kodirano u prvih 48 bita
    expect(parseInt(a.replace(/-/g, "").slice(0, 12), 16)).toBe(1_760_000_000_000);
  });
});

describe("kategorije i agregacije", () => {
  it("zadane kategorije imaju jedinstvene ključeve", () => {
    const keys = DEFAULT_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("hrana");
    // zadano: 5 troškovnih i jedna prihodna kategorija
    expect(DEFAULT_CATEGORIES.filter((c) => c.kind === "expense")).toHaveLength(5);
    expect(DEFAULT_CATEGORIES.filter((c) => c.kind === "income").map((c) => c.key)).toEqual(["posao"]);
  });

  const tx = [
    { amountCents: 1000, type: "expense", categoryId: "hrana", localDate: "2026-10-02" },
    { amountCents: 500, type: "expense", categoryId: "hrana", localDate: "2026-10-10" },
    { amountCents: 4000, type: "expense", categoryId: "auto", localDate: "2026-10-11" },
    { amountCents: 700, type: "expense", categoryId: null, localDate: "2026-10-12" },
    { amountCents: 9999, type: "income", categoryId: null, localDate: "2026-10-12" },
    { amountCents: 123, type: "expense", categoryId: "hrana", localDate: "2026-09-30" },
  ] as const;

  it("zbraja po kategoriji samo troškove tog mjeseca, silazno", () => {
    expect(totalsByCategory(tx, "2026-10")).toEqual([
      { categoryId: "auto", totalCents: 4000 },
      { categoryId: "hrana", totalCents: 1500 },
      { categoryId: null, totalCents: 700 },
    ]);
    expect(monthExpenseTotal(tx, "2026-10")).toBe(6200);
    expect(monthExpenseTotal(tx, "2026-09")).toBe(123);
  });

  it("prethodni mjesec i postotna promjena", () => {
    expect(previousMonth("2026-10")).toBe("2026-09");
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(percentChange(6200, 5000)).toBe(24);
    expect(percentChange(4000, 5000)).toBe(-20);
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe("Prijedlog kategorije pretplate", () => {
  it("prepoznaje česte nazive bez obzira na dijakritike i velika slova", async () => {
    const { suggestRecurring } = await import("../src");
    expect(suggestRecurring("Kredit")?.categoryKey).toBe("stan");
    expect(suggestRecurring("stambeni kredit")?.categoryKey).toBe("stan");
    expect(suggestRecurring("Režije")?.icon).toBe("drop");
    expect(suggestRecurring("Disney+")?.icon).toBe("brand:disneyplus");
    expect(suggestRecurring("YT Premium")?.icon).toBe("brand:youtube");
    expect(suggestRecurring("Spotify Family")?.icon).toBe("brand:spotify");
    expect(suggestRecurring("Teretana")?.categoryKey).toBe("zdravlje");
    expect(suggestRecurring("kred")?.categoryKey).toBe("stan");
  });
  it("nepoznat ili prekratak naziv nema prijedlog", async () => {
    const { suggestRecurring } = await import("../src");
    expect(suggestRecurring("x")).toBeNull();
    expect(suggestRecurring("Baka")).toBeNull();
  });
});

describe("Katalog pretplata", () => {
  it("prijedlozi dok tipkaš: najbolji pogodak prvi", async () => {
    const { searchCatalog } = await import("../src");
    expect(searchCatalog("net")[0]?.key).toBe("netflix");
    expect(searchCatalog("apple tv")[0]?.key).toBe("appletv");
    expect(searchCatalog("amazon prime video")[0]?.key).toBe("primevideo");
    expect(searchCatalog("n")).toEqual([]);
  });
  it("ključevi su jedinstveni", async () => {
    const { CATALOG } = await import("../src");
    expect(new Set(CATALOG.map((e) => e.key)).size).toBe(CATALOG.length);
  });
});

describe("Katalog: hrvatske usluge", () => {
  it("prepoznaje operatere, režije i prijevoz", async () => {
    const { suggestRecurring } = await import("../src");
    expect(suggestRecurring("MAXtv")?.icon).toBe("brand:maxtv");
    expect(suggestRecurring("A1 TV")?.icon).toBe("brand:a1tv");
    expect(suggestRecurring("A1")?.icon).toBe("brand:a1");
    expect(suggestRecurring("HBO Max")?.icon).toBe("brand:max");
    expect(suggestRecurring("Struja")?.categoryKey).toBe("stan");
    expect(suggestRecurring("HRT pristojba")?.icon).toBe("brand:hrt");
    expect(suggestRecurring("Odvoz otpada")?.icon).toBe("trash");
    expect(suggestRecurring("ZET mjesečna")?.icon).toBe("brand:zet");
    expect(suggestRecurring("Kasko")?.categoryKey).toBe("auto");
    expect(suggestRecurring("Kindle Unlimited")?.icon).toBe("brand:kindle");
    expect(suggestRecurring("Arena Sport")?.icon).toBe("brand:arenasport");
  });
});

describe("Planovi i cijene", () => {
  it("svaki plan pripada stavci kataloga, cijene su u centima", async () => {
    const { CATALOG, SERVICE_PLANS } = await import("../src");
    const keys = new Set(CATALOG.map((e) => e.key));
    for (const [k, v] of Object.entries(SERVICE_PLANS)) {
      expect(keys.has(k), k).toBe(true);
      for (const p of v.plans) expect(Number.isInteger(p.cents) && p.cents > 0).toBe(true);
    }
  });
  it("nudi samo mjesečne planove u eurima", async () => {
    const { monthlyPlans } = await import("../src");
    expect(monthlyPlans("netflix").map((p) => p.cents)).toEqual([599, 999, 1299]);
    expect(monthlyPlans("cursor")).toEqual([]); // cijene u USD
    expect(monthlyPlans("nintendoswitch")).toEqual([]); // samo godišnje
  });
});
