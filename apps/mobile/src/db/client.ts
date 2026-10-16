import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let db: SQLiteDatabase | null = null;

/**
 * Otvara bazu i primjenjuje migracije (sinkrono, traje milisekunde). Poziva se jednom pri pokretanju.
 * `journal_mode = WAL` daje brže pisanje i čitanje tijekom unosa.
 */
export function getDb(): SQLiteDatabase {
  if (db) return db;
  const d = openDatabaseSync("unitcent.db");
  d.execSync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const row = d.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    d.withTransactionSync(() => {
      d.execSync(m.sql);
      d.execSync(`PRAGMA user_version = ${m.version}`);
    });
  }
  db = d;
  return d;
}
