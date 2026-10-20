import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { kvGet } from "./db/repo";
import { useDb } from "./data";
import { FREE_SCANS, PREMIUM_SCANS, usePremium } from "./premium";
import { supabase } from "./supabase";

/**
 * Brojač skeniranja. Izvor istine je poslužitelj (`scan_usage`, kalendarski mjesec po Europe/Zagreb); klijent ga pamti
 * lokalno da se prikaz ne čeka na mrežu. Osvježava se: pri otvaranju kamere/unosa, nakon sinkronizacije i iz odgovora
 * svakog skeniranja (`usage.used`), pa je prikaz točan i nakon neuspjelih pokušaja (poslužitelj ih ne naplaćuje).
 */
export function zagrebMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}

function setKv(key: string, value: string): void {
  getDb().runSync("insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", [key, value]);
}

/** Upisuje broj iskorištenih skeniranja za tekući mjesec (iz odgovora poslužitelja). */
export function setScanUsed(used: number): void {
  setKv("scan.month", zagrebMonth());
  setKv("scan.used", String(Math.max(0, used)));
  notifyDbChanged();
}

/** Povlači brojač s poslužitelja (RLS: korisnik čita samo svoj redak). Tiho preskače bez veze ili sesije. */
export async function refreshScanUsage(): Promise<void> {
  if (!supabase) return;
  try {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;
    const month = zagrebMonth();
    const { data } = await supabase.from("scan_usage").select("count").eq("month", month).maybeSingle();
    setScanUsed(Number(data?.count ?? 0));
  } catch {
    // ostaje zadnja poznata vrijednost
  }
}

export interface ScanQuota {
  used: number;
  limit: number;
  remaining: number;
  premium: boolean;
}

export function useScanQuota(): ScanQuota {
  const premium = usePremium();
  const used = useDb(() => (kvGet("scan.month") === zagrebMonth() ? Number(kvGet("scan.used") ?? 0) : 0));
  const limit = premium ? PREMIUM_SCANS : FREE_SCANS;
  return { used, limit, remaining: Math.max(0, limit - used), premium };
}

/** „1 skeniranje“, „2 skeniranja“, „5 skeniranja“ (hrvatska množina). */
export function scansWord(n: number): string {
  return `${n} ${n === 1 ? "skeniranje" : "skeniranja"}`;
}

/**
 * Boja preostalih besplatnih skeniranja: sve = zeleno, više od pola = žuto, zadnje = narančasto, nijedno = crveno
 * (3/3, 2/3, 1/3, 0/3). Iste boje u obje teme jer se prikazuju na tamnoj podlozi (kamera, značka).
 */
export function quotaTone(remaining: number, limit: number): string {
  if (remaining <= 0) return "#f97066";
  if (remaining >= limit) return "#3dd6a3";
  return remaining / limit > 0.5 ? "#f5c542" : "#f59a3c";
}
