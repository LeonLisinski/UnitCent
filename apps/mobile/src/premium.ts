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
export const PRICE = { amount: "3,99 €", period: "mjesečno" } as const; // radna cijena (D-03), mijenja se na jednom mjestu
export const FREE_HISTORY_MONTHS = 6;

export function isPremiumNow(): boolean {
  if (kvGet("premium.dev") === "1") return true;
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
    if (next !== (kvGet("premium.until") ?? "")) {
      setKv("premium.until", next);
      notifyDbChanged();
    }
  } catch {
    // ostaje zadnja poznata vrijednost
  }
}

/** Samo za razvoj: ručno uključi/isključi Premium dok kupnja nije povezana. */
export function setDevPremium(on: boolean): void {
  setKv("premium.dev", on ? "1" : "0");
  notifyDbChanged();
}
