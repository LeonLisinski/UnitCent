import { overlapCursor, remoteWins, type Cursor, type SyncStamp } from "./sync";

/**
 * Sinkronizacijski motor (docs/APP-PLAN.md §4.4), neovisan o bazi i mreži: aplikacija mu daje lokalnu pohranu (SQLite)
 * i udaljenu (Supabase), a testovi lažne verzije. Tako se isti kod koji radi na mobitelu može provjeriti bez uređaja.
 *
 * Push: outbox je samo oznaka „izmijenjeno“; šalje se TRENUTNO stanje retka (uzastopne izmjene se spajaju), tablicama
 *   redom roditelji pa djeca. Briše se samo ono što je poslano, a izmjene nastale tijekom slanja ostaju.
 * Pull: stranice od kursora (updated_at, id) s preklopom od 5 s; primjena je idempotentna i podliježe pravilu sukoba.
 */

export type Row = Record<string, unknown>;

export interface TableCfg {
  name: string;
  cols: string[];
  /** Stupci koji su logički tip u poslužitelju, a 0/1 lokalno. */
  bools: string[];
  /** Vremenski stupci: lokalno se pamte u ISO obliku s "Z". */
  times: string[];
}

const COMMON = ["created_at", "client_updated_at", "deleted_at", "rev"];
const TIMES = ["created_at", "client_updated_at", "deleted_at"];

/** Redoslijed poštuje strane ključeve: roditelji prije djece. */
export const SYNC_TABLES: TableCfg[] = [
  { name: "categories", cols: ["id", "name", "icon", "color_token", "sort", "is_system", "archived", ...COMMON], bools: ["is_system", "archived"], times: TIMES },
  {
    name: "recurring_items",
    cols: ["id", "name", "amount_cents", "day_of_month", "category_id", "active", "start_date", "end_date", "icon_key", ...COMMON],
    bools: ["active"],
    times: TIMES,
  },
  { name: "month_plans", cols: ["id", "month", "income_cents", "savings_cents", ...COMMON], bools: [], times: TIMES },
  {
    name: "transactions",
    cols: ["id", "amount_cents", "type", "category_id", "note", "merchant", "local_date", "occurred_at", "source", "receipt_id", "recurring_id", ...COMMON],
    bools: [],
    times: [...TIMES, "occurred_at"],
  },
];

export interface LocalStore {
  /** Retci s neposlanim izmjenama (jedan zapis po retku), po redoslijedu nastanka; `seq` je zadnja oznaka tog retka. */
  pending(table: string, limit: number): { rowId: string; seq: number }[];
  /** Trenutno lokalno stanje redaka (sirove lokalne vrijednosti, logički tipovi kao 0/1). */
  read(table: string, cols: string[], ids: string[]): Row[];
  /** Briše oznake retka do `seq` (uključivo): novije izmjene ostaju. */
  ack(table: string, rowId: string, upToSeq: number): void;
  stamp(table: string, id: string): SyncStamp | null;
  /** Upis udaljenog retka (već normaliziran u lokalni oblik) BEZ stavljanja u outbox. */
  apply(cfg: TableCfg, row: Row): void;
  getCursor(table: string): Cursor | null;
  setCursor(table: string, c: Cursor): void;
  transaction<T>(fn: () => T): T;
}

export interface RemoteStore {
  /** Idempotentan upsert skupine redaka (poslužiteljska pravila sukoba). Baca grešku ako ne uspije. */
  push(table: string, rows: Row[]): Promise<void>;
  /** Stranica redaka strogo nakon (updated_at, id) kursora, poredanih po (updated_at, id). */
  pull(table: string, after: Cursor | null, limit: number): Promise<Row[]>;
}

export const normTime = (v: unknown): string | null => (v == null ? null : new Date(v as string).toISOString());

/** Lokalni redak → oblik za poslužitelj (0/1 → boolean). */
export function toRemoteRow(cfg: TableCfg, r: Row): Row {
  const out: Row = { ...r };
  for (const b of cfg.bools) out[b] = r[b] === 1 || r[b] === true;
  return out;
}

/** Udaljeni redak → lokalni oblik (boolean → 0/1, vremena u ISO, `updated_at` se pamti). */
export function toLocalRow(cfg: TableCfg, r: Row): Row {
  const out: Row = {};
  for (const c of [...cfg.cols, "updated_at"]) {
    const v = r[c];
    if (cfg.bools.includes(c)) out[c] = v ? 1 : 0;
    else if (c === "updated_at" || cfg.times.includes(c)) out[c] = normTime(v);
    else out[c] = v ?? null;
  }
  return out;
}

export async function pushAll(local: LocalStore, remote: RemoteStore, tables: TableCfg[] = SYNC_TABLES, batch = 100): Promise<void> {
  for (const cfg of tables) {
    for (;;) {
      const pending = local.pending(cfg.name, batch);
      if (pending.length === 0) break;
      const rows = local.read(cfg.name, cfg.cols, pending.map((p) => p.rowId)).map((r) => toRemoteRow(cfg, r));
      if (rows.length > 0) await remote.push(cfg.name, rows);
      local.transaction(() => {
        for (const p of pending) local.ack(cfg.name, p.rowId, p.seq);
      });
      if (pending.length < batch) break;
    }
  }
}

/** Vraća true ako je ijedan lokalni redak promijenjen. */
export async function pullAll(local: LocalStore, remote: RemoteStore, tables: TableCfg[] = SYNC_TABLES, page = 500): Promise<boolean> {
  let changed = false;
  for (const cfg of tables) {
    let cur: Cursor | null = overlapCursor(local.getCursor(cfg.name));
    for (;;) {
      const rows = await remote.pull(cfg.name, cur, page);
      if (rows.length === 0) break;
      local.transaction(() => {
        for (const r of rows) {
          const mine = local.stamp(cfg.name, r.id as string);
          const theirs: SyncStamp = { clientUpdatedAt: normTime(r.client_updated_at)!, rev: Number(r.rev ?? 0) };
          if (!remoteWins(mine, theirs)) continue;
          local.apply(cfg, toLocalRow(cfg, r));
          changed = true;
        }
      });
      const last = rows[rows.length - 1]!;
      cur = { updatedAt: last.updated_at as string, id: last.id as string };
      local.setCursor(cfg.name, cur);
      if (rows.length < page) break;
    }
  }
  return changed;
}
