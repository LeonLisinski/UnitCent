import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { homeCurrency } from "./currency";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { ensureCategories, today } from "./db/repo";
import { ensureAnonymousSession, supabase } from "./supabase";

/** Polje za CSV: navodnici samo kad treba (razdjelnik, navodnik, novi red). */
const cell = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
/** Iznos u centima kao „12,34“ (decimalni zarez, bez tisućica: Excel ga čita kao broj). */
const amount = (cents: number) => `${Math.trunc(cents / 100)},${String(Math.abs(cents) % 100).padStart(2, "0")}`;

/**
 * Izvoz troškova i prihoda u CSV za Excel/Numbers (pravo na prenosivost; besplatno za sve).
 * Samo ono što korisnik vidi: datum, vrsta, iznos, kategorija, trgovac, bilješka, porijeklo. Bez ID-jeva i
 * tehničkih polja: podaci su korisnikovi, a struktura aplikacije nije dio izvoza.
 */
export async function exportData(): Promise<boolean> {
  const rows = getDb().getAllSync<{ local_date: string; type: string; amount_cents: number; category: string | null; merchant: string | null; note: string | null; source: string }>(
    `select t.local_date, t.type, t.amount_cents, c.name as category, t.merchant, t.note, t.source
       from transactions t left join categories c on c.id = t.category_id
      where t.deleted_at is null
      order by t.local_date, t.occurred_at`,
  );
  const SOURCE: Record<string, string> = { manual: "Ručni unos", scan: "Skeniran račun", recurring: "Pretplata" };
  const lines = [
    ["Datum", "Vrsta", `Iznos (${homeCurrency()})`, "Kategorija", "Trgovac", "Bilješka", "Unos"].join(";"),
    ...rows.map((r) =>
      [
        r.local_date.split("-").reverse().join("."), // 21.10.2026
        r.type === "income" ? "Prihod" : "Trošak",
        amount(r.amount_cents),
        cell(r.category ?? ""),
        cell(r.merchant ?? ""),
        cell(r.note ?? ""),
        SOURCE[r.source] ?? "",
      ].join(";"),
    ),
  ];
  const file = new File(Paths.cache, `unitcent-troskovi-${today()}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write("﻿" + lines.join("\r\n")); // BOM: Excel prepozna UTF-8 (č, ć, š, ž, đ)
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: "text/csv", UTI: "public.comma-separated-values-text", dialogTitle: "Izvezi troškove" });
  return true;
}

/** Briše sve lokalne podatke i postavke (aplikacija se vraća na prvo pokretanje). */
export function wipeLocalData(): void {
  const db = getDb();
  db.withTransactionSync(() => {
    for (const t of ["transactions", "receipt_items", "receipts", "recurring_items", "month_plans", "savings_entries", "budgets", "categories", "outbox", "kv"]) {
      db.runSync(`delete from ${t}`);
    }
  });
  ensureCategories();
  notifyDbChanged();
}

/**
 * Briše račun na poslužitelju (Edge Function `delete-account`) pa lokalne podatke i otvara novu anonimnu sesiju.
 * Bez računa/sesije briše samo lokalno. Vraća false ako brisanje na poslužitelju nije uspjelo (lokalno se tada NE briše).
 */
export async function deleteAccountAndData(): Promise<boolean> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) return false;
      await supabase.auth.signOut({ scope: "local" });
    }
  }
  wipeLocalData();
  void ensureAnonymousSession();
  return true;
}
