import { describe, expect, it } from "vitest";
import { availableFor, isoWeek, lastWeek, monthSummary, weekSummary, type DigestInput } from "../../../supabase/functions/email-send/digest";
import { dateRange, plural, tipsEmail, weeklyEmail, welcomeEmail, monthlyEmail, winbackEmail } from "../../../supabase/functions/email-send/templates";
import type { Tx } from "../../../supabase/functions/insights/facts";

const tx = (date: string, cents: number, cat: string, extra: Partial<Tx> = {}): Tx => ({ amount_cents: cents, type: "expense", category_id: cat, local_date: date, source: "manual", ...extra });

// Službeni primjer: 1.468,00 − 771,33 (obavezno) − 150,00 = 546,67 € za trošenje.
const base: DigestInput = {
  transactions: [
    tx("2026-10-13", 2065, "hrana"),
    tx("2026-10-14", 1000, "auto"),
    tx("2026-10-15", 499, "hrana"),
    tx("2026-10-19", 3000, "zabava"),
    tx("2026-10-12", 1399, "pretplate", { source: "recurring" }),
    tx("2026-10-20", 9999, "hrana"), // izvan tjedna
  ],
  categories: [
    { id: "hrana", name: "Hrana" },
    { id: "auto", name: "Auto" },
    { id: "zabava", name: "Zabava" },
  ],
  recurring: [{ amount_cents: 77_133, day_of_month: 1, start_date: "2026-01-01", end_date: null, active: true }],
  plans: [{ month: "2026-09", income_cents: 146_800, savings_cents: 15_000 }],
};
const unsub = "https://unitcent.com/odjava?t=abc";

describe("tjedni i mjesečni sažetak", () => {
  it("prošli tjedan je ponedjeljak do nedjelje", () => {
    expect(lastWeek("2026-10-20")).toEqual({ start: "2026-10-12", end: "2026-10-18", period: "2026-W42" });
    expect(lastWeek("2026-10-26")).toEqual({ start: "2026-10-19", end: "2026-10-25", period: "2026-W43" });
  });

  it("ISO tjedan pripada godini svog četvrtka", () => {
    expect(isoWeek("2026-12-28")).toBe("2026-W53");
    expect(isoWeek("2027-01-04")).toBe("2027-W01");
    expect(isoWeek("2025-12-29")).toBe("2026-W01");
  });

  it("plan vrijedi iz zadnjeg ranijeg mjeseca; pretplate nisu potrošeno", () => {
    expect(availableFor(base, "2026-10")).toBe(54_667);
    const w = weekSummary(base, "2026-10-12", "2026-10-18");
    expect(w.spentCents).toBe(2065 + 1000 + 499);
    expect(w.entries).toBe(3);
    expect(w.daysWithEntries).toBe(3);
    expect(w.top).toEqual({ name: "Hrana", cents: 2564 });
    expect(w.targetCents).toBe(Math.round((54_667 / 31) * 7));
  });

  it("bez plana nema cilja tjedna", () => {
    const w = weekSummary({ ...base, plans: [] }, "2026-10-12", "2026-10-18");
    expect(w.targetCents).toBeNull();
  });

  it("mjesec: varijabilni troškovi i najveće kategorije", () => {
    const m = monthSummary(base, "2026-10");
    expect(m.spentCents).toBe(2065 + 1000 + 499 + 3000 + 9999);
    expect(m.availableCents).toBe(54_667);
    expect(m.top.map((c) => c.name)).toEqual(["Hrana", "Zabava", "Auto"]);
  });
});

describe("predlošci", () => {
  it("hrvatska množina i raspon datuma", () => {
    expect([1, 2, 5, 11, 12, 21, 22].map((n) => plural(n, "dan", "dana", "dana"))).toEqual(["dan", "dana", "dana", "dana", "dana", "dan", "dana"]);
    expect(plural(3, "unos", "unosa", "unosa")).toBe("unosa");
    expect(dateRange("2026-10-12", "2026-10-18")).toBe("12. – 18. 10.");
    expect(dateRange("2026-10-26", "2026-11-01")).toBe("26. 10. – 1. 11.");
  });

  it("tjedni mail: broj u naslovu, odjava, bez Premiuma kad nije red", () => {
    const w = weekSummary(base, "2026-10-12", "2026-10-18");
    const mail = weeklyEmail("Ana", w, { premiumCta: false }, unsub);
    expect(mail.subject).toBe("Tvoj tjedan: 35,64 € od 123,44 €");
    expect(mail.html).toContain("Bok Ana,");
    expect(mail.html).toContain(unsub);
    expect(mail.html).not.toContain("Premium");
    expect(mail.text).toContain("Odjava: " + unsub);
    expect(weeklyEmail(null, w, { premiumCta: true }, unsub).html).toContain("Premium");
  });

  it("ime se escapea", () => {
    expect(welcomeEmail("<b>x</b>", unsub).html).toContain("Bok &lt;b&gt;x&lt;/b&gt;,");
  });

  it("nijedan mail nema ograde o osudi ni krivnji", () => {
    const w = weekSummary(base, "2026-10-12", "2026-10-18");
    const all = [welcomeEmail(null, unsub), tipsEmail(null, unsub), weeklyEmail(null, w, { premiumCta: true }, unsub), monthlyEmail(null, monthSummary(base, "2026-10"), { premiumCta: false }, unsub), winbackEmail(null, unsub)];
    for (const m of all) {
      const t = (m.subject + m.text).toLowerCase();
      expect(t).not.toMatch(/osud|krivn|sram/);
      expect(m.html).toContain('meta name="color-scheme"');
    }
  });
});
