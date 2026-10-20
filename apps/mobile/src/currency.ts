import { FALLBACK_RATES, convertCents, currencyInfo, setDisplaySymbol, type Cents } from "@unitcent/core";
import { useDb } from "./data";
import { convertAllAmounts, kvGet, kvSet } from "./db/repo";

/**
 * Zadana valuta i tečajevi. Sve se vodi u zadanoj valuti (Postavke → Valuta, zadano EUR); strani iznosi se pri unosu
 * pretvaraju po tečaju, a promjena zadane valute pretvara sve spremljene iznose. Tečajevi (jedinica za 1 €) dohvaćaju se jednom dnevno i pamte lokalno, pa pretvorba radi i bez
 * interneta; prije prvog dohvata vrijede približni tečajevi iz core (FALLBACK_RATES).
 */
const RATES_URL = "https://open.er-api.com/v6/latest/EUR"; // besplatno, bez ključa; ECB ne objavljuje RSD/BAM/MKD

export function homeCurrency(): string {
  return kvGet("currency") ?? "EUR";
}

/** Pri pokretanju (prije prvog ekrana): oznaka zadane valute u svim iznosima. */
export function initCurrency(): void {
  setDisplaySymbol(currencyInfo(homeCurrency()).symbol);
}

/**
 * Mijenja zadanu valutu i pretvara sve postojeće iznose po zadnjem poznatom tečaju (plan, troškovi, pretplate,
 * štednja, budžeti, računi). Vraća false ako tečaj nije poznat (tada se ništa ne mijenja).
 */
export function setHomeCurrency(code: string): boolean {
  const from = homeCurrency();
  if (code === from) return true;
  const { rates } = getRates();
  const factor = convertFactor(from, code, rates);
  if (factor === null) return false;
  convertAllAmounts(factor);
  setDisplaySymbol(currencyInfo(code).symbol);
  kvSet("currency", code);
  return true;
}

/** Koliko jedinica valute `to` vrijedi 1 jedinica valute `from` (null ako tečaj nije poznat). */
export function convertFactor(from: string, to: string, rates: Readonly<Record<string, number>>): number | null {
  const rf = rates[from];
  const rt = rates[to];
  return rf && rt ? rt / rf : null;
}

export interface Rates {
  date: string | null;
  rates: Record<string, number>;
}

export function getRates(): Rates {
  try {
    const raw = kvGet("fx.rates");
    if (raw) {
      const r = JSON.parse(raw) as Rates;
      return { date: r.date, rates: { ...FALLBACK_RATES, ...r.rates } };
    }
  } catch {
    // pokvaren zapis: rezervni tečajevi
  }
  return { date: null, rates: { ...FALLBACK_RATES } };
}

/** Osvježava tečajeve jednom dnevno; tiho preskače bez interneta. */
export async function refreshRates(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const cur = getRates();
  if (cur.date === today && Object.keys(cur.rates).length > 40) return; // stariji zapis imao je samo ponuđene valute
  try {
    const res = await fetch(RATES_URL);
    if (!res.ok) return;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return;
    // Pamte se SVI tečajevi (~160 valuta), ne samo ponuđene: račun s putovanja (npr. u bahtima) se tako i dalje pretvara.
    const rates: Record<string, number> = {};
    for (const [code, v] of Object.entries(data.rates)) {
      if (/^[A-Z]{3}$/.test(code) && typeof v === "number" && v > 0) rates[code] = v;
    }
    kvSet("fx.rates", JSON.stringify({ date: today, rates }));
  } catch {
    // ostaju zadnji poznati tečajevi
  }
}

/** Zadana valuta i pretvorba u nju (reaktivno, prati promjenu valute i tečajeva). */
export function useCurrency(): { home: string; rates: Rates; toHome: (cents: Cents, from: string) => Cents | null } {
  const home = useDb(() => homeCurrency());
  const rates = useDb(() => getRates());
  return { home, rates, toHome: (cents, from) => convertCents(cents, from, home, rates.rates) };
}
