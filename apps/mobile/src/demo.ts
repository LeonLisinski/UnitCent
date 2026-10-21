// Demo podaci za snimke zaslona u trgovinama. Rade SAMO u razvoju na webu (`?demo=1` u adresi); u buildu za
// trgovinu ovaj kod se ne izvodi (__DEV__ je false). Brojke su službeni primjer iz CLAUDE.md:
// primanja 1.468,00 € − obavezno 771,33 € (11 stavki) − štednja 150,00 € = 546,67 €; dnevni budžet 19,96 €;
// račun Konzum, 6 stavki, 20,65 € (Hrana 10,46 · Auto 4,99 · Kućanstvo 5,20).
import { LogBox, Platform } from "react-native";
import { daysLeftInclusive, yearMonthOf, type Cents, type LocalDate } from "@unitcent/core";
import { addCategory, addRecurring, addTransaction, kvGet, kvSet, listCategories, setSavingsBalance, today, upsertPlan } from "./db/repo";
import { setLastScan } from "./scan";

export const DEMO = __DEV__ && Platform.OS === "web" && typeof window !== "undefined" && /[?&]demo=1\b/.test(window.location.search);

const DAILY: Cents = 1996;

/** Puni lokalnu bazu jednom (kv „demo.seeded“). Vraća true ako je upravo napunjeno. */
export function seedDemo(): boolean {
  if (!DEMO) return false;
  LogBox.ignoreAllLogs(true); // bez razvojnih poruka na snimkama
  if (kvGet("demo.seeded") === "1") return false;
  const day = today();
  const month = yearMonthOf(day);
  const cats = listCategories("expense");
  const id = (key: string) => cats.find((c) => c.key === key)?.id ?? null;
  const kucanstvo = addCategory({ name: "Kućanstvo", icon: "house", colorToken: "cat-stan" }).id;

  // Obavezno: 11 stavki, ukupno 771,33 €.
  const monthStart = `${month}-01`;
  const fixed: [string, number, number, string, string][] = [
    ["Najam", 42000, 1, "stan", "house"],
    ["Režije", 12000, 15, "stan", "drop"],
    ["Plin", 4135, 15, "stan", "bolt"],
    ["Voda", 1800, 20, "stan", "drop"],
    ["Pričuva", 3500, 5, "stan", "house"],
    ["Mobitel", 1500, 10, "stan", "phone"],
    ["Internet", 2500, 10, "stan", "wifi"],
    ["Osiguranje", 4500, 20, "auto", "shield"],
    ["Teretana", 3500, 1, "zdravlje", "dumbbell"],
    ["Netflix", 999, 25, "ostalo", "brand:netflix"],
    ["Spotify", 699, 28, "ostalo", "brand:spotify"],
  ];
  for (const [name, cents, dom, cat, icon] of fixed) {
    addRecurring({ name, amountCents: cents, dayOfMonth: dom, categoryId: id(cat), iconKey: icon, startDate: monthStart });
  }

  upsertPlan({ month, incomeCents: 146_800, savingsCents: 15_000, spentBeforeCents: 0 });
  setSavingsBalance(month, 124_000);

  // Potrošeno prije danas tako da je današnji dnevni budžet točno 19,96 €.
  const available = 146_800 - 77_133 - 15_000; // 546,67 €
  const left = daysLeftInclusive(day);
  let before = Math.max(0, available - DAILY * left);
  const pattern: [string, number, string | null][] = [
    ["hrana", 2340, "Konzum"],
    ["auto", 4500, "INA"],
    ["hrana", 860, "Pekara"],
    ["ostalo", 1250, null],
    ["hrana", 3120, "Lidl"],
    ["zdravlje", 990, "Ljekarna"],
    ["hrana", 540, "Kava"],
    ["auto", 3800, "Tifon"],
    ["hrana", 1870, "Spar"],
  ];
  const dim = Number(day.slice(8));
  const past: LocalDate[] = [];
  for (let d = 1; d < dim; d++) past.push(`${month}-${String(d).padStart(2, "0")}`);
  // Najprije složi troškove od jučer unatrag, zatim ih upiši od najstarijeg: „Zadnje“ (po vremenu unosa) tada
  // pokazuje jučer i prekjučer, a svi dani imaju unos (niz).
  const planned: { date: LocalDate; cat: string; cents: number; merchant: string | null }[] = [];
  let i = 0;
  while (before > 0 && past.length > 0) {
    const [cat, cents, merchant] = pattern[i % pattern.length]!;
    const date = past[past.length - 1 - (i % past.length)]!;
    const amount = Math.min(cents, before);
    planned.push({ date, cat, cents: amount, merchant });
    before -= amount;
    i += 1;
  }
  for (const t of planned.reverse()) {
    addTransaction({ amountCents: t.cents, categoryId: id(t.cat), localDate: t.date, merchant: t.merchant });
  }

  // Danas: dva mala troška (ostaje 14,46 € od 19,96 €).
  addTransaction({ amountCents: 240, categoryId: id("hrana"), localDate: day, note: "Kava" });
  addTransaction({ amountCents: 310, categoryId: id("hrana"), localDate: day, merchant: "Pekara" });

  kvSet("name", "Ana");
  kvSet("onboarded", "1");
  kvSet("demo.seeded", "1");
  return true;
}

/** Zadnje skeniranje (ekran „Pregledaj račun“) živi u memoriji, pa se postavlja pri svakom učitavanju demo načina. */
export function demoScan(): void {
  if (!DEMO) return;
  const day = today();
  const cats = listCategories("expense");
  const id = (key: string) => cats.find((c) => c.key === key)?.id ?? null;
  const kucanstvo = cats.find((c) => c.name === "Kućanstvo")?.id ?? null;
  const hrana = id("hrana");
  const auto = id("auto");
  setLastScan(
    {
      status: "ok",
      merchant: "Konzum",
      date: day,
      total_cents: 2065,
      sum_cents: 2065,
      currency: "EUR",
      items: [
        { raw_name: "MLIJEKO 2,8% 1L", name: "Mlijeko", amount_cents: 129, category_id: hrana, line_type: "item", confidence: 0.98 },
        { raw_name: "KRUH POLUBIJELI", name: "Kruh", amount_cents: 219, category_id: hrana, line_type: "item", confidence: 0.97 },
        { raw_name: "JAJA L 10/1", name: "Jaja", amount_cents: 349, category_id: hrana, line_type: "item", confidence: 0.96 },
        { raw_name: "JABUKE GALA KG", name: "Jabuke", amount_cents: 349, category_id: hrana, line_type: "item", confidence: 0.95 },
        { raw_name: "TEK.ZA STAKLA ZIM.", name: "Tekućina za stakla", amount_cents: 499, category_id: auto, line_type: "item", confidence: 0.91 },
        { raw_name: "DETERDZENT SUDJE", name: "Deterdžent za suđe", amount_cents: 520, category_id: kucanstvo, line_type: "item", confidence: 0.93 },
      ],
      reasons: [],
      usage: { used: 1, limit: 3, premium: false },
    },
    null,
  );
}
