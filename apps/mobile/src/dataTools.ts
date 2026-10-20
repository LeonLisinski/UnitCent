import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { homeCurrency } from "./currency";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { ensureCategories, today } from "./db/repo";
import { ensureAnonymousSession, supabase } from "./supabase";

/** Izvoz svih korisnikovih podataka u JSON (pravo na prenosivost; besplatno za sve). */
export async function exportData(): Promise<boolean> {
  const db = getDb();
  const all = (t: string) => db.getAllSync(`select * from ${t} where deleted_at is null order by created_at`);
  const payload = {
    app: "UnitCent",
    exportedAt: new Date().toISOString(),
    currency: homeCurrency(),
    note: "Iznosi (amount_cents, *_cents) su u stotinkama navedene valute.",
    categories: all("categories"),
    transactions: all("transactions"),
    recurring_items: all("recurring_items"),
    month_plans: all("month_plans"),
    savings_entries: all("savings_entries"),
    receipts: all("receipts"),
    receipt_items: all("receipt_items"),
    budgets: all("budgets"),
  };
  const file = new File(Paths.cache, `unitcent-podaci-${today()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Izvezi podatke" });
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
