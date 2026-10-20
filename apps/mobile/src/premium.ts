import { useDb } from "./data";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { kvGet } from "./db/repo";
import { supabase } from "./supabase";

/**
 * Premium: pristup se čita iz tablice `entitlements` (piše je samo poslužitelj, kasnije RevenueCat webhook) i pamti lokalno,
 * pa gating radi i bez interneta. Besplatna verzija: pregled zadnjih FREE_HISTORY_MONTHS mjeseci i ograničen broj skeniranja.
 * Kupnja još nije povezana (RevenueCat traži build i račune trgovina), zato u razvoju postoji ručni prekidač.
 */
export type PlanKey = "monthly" | "yearly";
/** Cijene su radne (D-03) i mijenjaju se samo ovdje; prave cijene dolaze iz trgovine kad se poveže RevenueCat. */
export const PLANS: Record<PlanKey, { cents: number; priceLabel: string; per: string; storeId: string }> = {
  monthly: { cents: 299, priceLabel: "2,99 €", per: "mjesečno", storeId: "unitcent_premium_monthly" },
  yearly: { cents: 1999, priceLabel: "19,99 €", per: "godišnje", storeId: "unitcent_premium_yearly" },
};
/** Ušteda godišnjeg u odnosu na 12 mjesečnih (u postocima). */
export const YEARLY_SAVING_PCT = Math.round((1 - PLANS.yearly.cents / (PLANS.monthly.cents * 12)) * 100);
export const FREE_HISTORY_MONTHS = 6;

/**
 * Alati za testiranje (prekidač Premiuma u Profilu): u razvoju i u internim buildovima (EAS „preview“ postavlja
 * EXPO_PUBLIC_DEV_TOOLS=1). U produkciji ih nema. Prekidač mijenja samo prikaz u aplikaciji; poslužitelj i dalje
 * provodi svoja ograničenja (npr. broj skeniranja).
 */
export const DEV_TOOLS = __DEV__ || process.env.EXPO_PUBLIC_DEV_TOOLS === "1";

export function isPremiumNow(): boolean {
  if (DEV_TOOLS && kvGet("dev.premium") === "1") return true;
  const until = kvGet("premium.until");
  return !!until && Date.parse(until) > Date.now();
}

/** Premium status koji se osvježava s bazom (reaktivno). */
export function usePremium(): boolean {
  return useDb(() => isPremiumNow());
}

/** Najraniji mjesec dostupan u besplatnoj verziji: tekući i prethodnih 5 (ukupno 6). */
export function freeMinMonth(): string {
  const d = new Date();
  const idx = d.getFullYear() * 12 + d.getMonth() - (FREE_HISTORY_MONTHS - 1);
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

function setKv(key: string, value: string): void {
  getDb().runSync("insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", [key, value]);
}

/** Povlači status pretplate s poslužitelja (RLS: korisnik čita samo svoj redak). Tiho preskače bez veze ili sesije. */
export async function refreshEntitlement(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.from("entitlements").select("premium_until").maybeSingle();
    const next = (data?.premium_until as string | null) ?? "";
    // Testni prekidač uključen prije nego je postojala funkcija `dev-premium`: jednom ga upiši i na poslužitelj.
    if (!next && isDevPremium() && kvGet("dev.premium.server") !== "1") {
      setKv("dev.premium.server", "1");
      void setDevPremium(true);
    }
    if (next !== (kvGet("premium.until") ?? "")) {
      setKv("premium.until", next);
      notifyDbChanged();
    }
  } catch {
    // ostaje zadnja poznata vrijednost
  }
}

/**
 * Samo za testiranje: ručno uključi/isključi Premium dok kupnja nije povezana. Pamti se na uređaju i (na dev
 * projektu) upisuje i na poslužitelj (funkcija `dev-premium`), da i poslužiteljska ograničenja (npr. 100 skeniranja)
 * vrijede kao za Premium. Vraća false ako poslužitelj nije potvrdio (npr. bez interneta): tada vrijedi samo u aplikaciji.
 */
export async function setDevPremium(on: boolean): Promise<boolean> {
  if (!DEV_TOOLS) return false;
  setKv("dev.premium", on ? "1" : "0");
  notifyDbChanged();
  if (!supabase) return false;
  try {
    const { error } = await supabase.functions.invoke("dev-premium", { body: { on } });
    if (error) return false;
    await refreshEntitlement();
    return true;
  } catch {
    return false;
  }
}

/** Je li Premium uključen ručnim prekidačem za testiranje. */
export function isDevPremium(): boolean {
  return DEV_TOOLS && kvGet("dev.premium") === "1";
}

/** Broj skeniranja mjesečno: besplatno 3, Premium 100 (pošteno korištenje). Mora odgovarati poslužitelju (scan-receipt). */
export const FREE_SCANS = 3;
export const PREMIUM_SCANS = 100;

/**
 * Probno razdoblje: svaki novi korisnik može isprobati Premium 7 dana besplatno (pretplata u trgovini s „introductory offer“,
 * kartica/Apple Pay/Google Pay se odobri unaprijed, naplata tek nakon 7 dana). Uključuje se kad su proizvodi u trgovinama
 * postavljeni s probnim razdobljem (EXPO_PUBLIC_TRIAL=1), da aplikacija ne obećava nešto što još ne postoji.
 */
export const TRIAL_DAYS = 7;
export const TRIAL_ENABLED = process.env.EXPO_PUBLIC_TRIAL === "1";

/** Premium otvoren zbog ograničenja: ta funkcija je istaknuta (vidi app/premium.tsx), ostale pogodnosti ispod. */
export type PremiumFeature = "scan" | "history" | "insights" | "budgets" | "advisor";
export const premiumHref = (feature?: PremiumFeature) =>
  (feature ? { pathname: "/premium", params: { feature } } : "/premium") as unknown as import("expo-router").Href;
