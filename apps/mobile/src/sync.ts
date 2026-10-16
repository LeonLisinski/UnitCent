import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import {
  DEFAULT_CATEGORIES,
  backoffSeconds,
  keysetFilter,
  overlapCursor,
  remoteWins,
  uuidV5,
  type Cursor,
} from "@unitcent/core";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { kvGet } from "./db/repo";
import { setSyncHandler } from "./db/syncSignal";
import { ensureAnonymousSession, supabase } from "./supabase";

/**
 * Sinkronizacija (docs/APP-PLAN.md §4.4): lokalna baza je izvor istine, mreža je pozadinski posao.
 * Push: outbox je samo oznaka "izmijenjeno", a šalje se TRENUTNO stanje retka (uzastopne izmjene
 *   istog retka se spajaju). Poslužitelj primjenjuje "zadnja izmjena pobjeđuje" (sync_push).
 * Pull: stranice po 500 od kursora (updated_at, id) s preklopom od 5 s; ista pravila sukoba lokalno.
 */

const PAGE = 500;
const BATCH = 100;
const PLAN_NAMESPACE = "9b0c1e52-7d1a-4f6b-8a3c-5e2d4f7a9c10";

interface TableCfg {
  name: string;
  cols: string[];
  bools: string[];
  times: string[];
}

const COMMON = ["created_at", "client_updated_at", "deleted_at", "rev"];
const TIMES = ["created_at", "client_updated_at", "deleted_at"];

/** Redoslijed poštuje strane ključeve: roditelji prije djece. */
const TABLES: TableCfg[] = [
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

type Row = Record<string, unknown>;

const defaultKeyById = new Map(DEFAULT_CATEGORIES.map((c) => [uuidV5(`category:${c.key}`, PLAN_NAMESPACE), c.key]));

const normTime = (v: unknown): string | null => (v == null ? null : new Date(v as string).toISOString());

/* ---------- push ---------- */

async function pushAll(): Promise<void> {
  const db = getDb();
  for (const cfg of TABLES) {
    for (;;) {
      const pending = db.getAllSync<{ row_id: string; seq: number }>(
        "select row_id, max(seq) as seq from outbox where table_name = ? group by row_id order by min(seq) limit ?",
        [cfg.name, BATCH],
      );
      if (pending.length === 0) break;

      const ids = pending.map((p) => p.row_id);
      const local = db.getAllSync<Row>(
        `select ${cfg.cols.join(", ")} from ${cfg.name} where id in (${ids.map(() => "?").join(",")})`,
        ids,
      );
      const rows = local.map((r) => {
        const out: Row = { ...r };
        for (const b of cfg.bools) out[b] = r[b] === 1;
        return out;
      });

      if (rows.length > 0) {
        const { error } = await supabase!.rpc("sync_push", { p_table: cfg.name, p_op: "upsert", p_rows: rows });
        if (error) throw new Error(`sync_push ${cfg.name}: ${error.message}`);
      }
      // Briše se samo ono što je poslano; izmjene nastale tijekom slanja ostaju za sljedeći krug.
      db.withTransactionSync(() => {
        for (const p of pending) {
          db.runSync("delete from outbox where table_name = ? and row_id = ? and seq <= ?", [cfg.name, p.row_id, p.seq]);
        }
      });
      if (pending.length < BATCH) break;
    }
  }
}

/* ---------- pull ---------- */

function loadCursor(table: string): Cursor | null {
  const raw = kvGet(`sync.cursor.${table}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Cursor;
  } catch {
    return null;
  }
}

function saveCursor(table: string, c: Cursor): void {
  // Izravno u bazu: kvSet bi bez potrebe osvježavao zaslone.
  getDb().runSync(
    "insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
    [`sync.cursor.${table}`, JSON.stringify(c)],
  );
}

function applyRemote(cfg: TableCfg, r: Row): boolean {
  const db = getDb();
  const local = db.getFirstSync<{ client_updated_at: string; rev: number }>(
    `select client_updated_at, rev from ${cfg.name} where id = ?`,
    [r.id as string],
  );
  const remote = { clientUpdatedAt: normTime(r.client_updated_at)!, rev: Number(r.rev ?? 0) };
  if (!remoteWins(local ? { clientUpdatedAt: local.client_updated_at, rev: local.rev } : null, remote)) return false;

  const cols = [...cfg.cols, "updated_at"];
  const values = cols.map((c) => {
    const v = r[c];
    if (cfg.bools.includes(c)) return v ? 1 : 0;
    if (c === "updated_at" || cfg.times.includes(c)) return normTime(v);
    return (v ?? null) as string | number | null;
  });
  const set = cols.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
  db.runSync(
    `insert into ${cfg.name} (${cols.join(", ")}) values (${cols.map(() => "?").join(", ")})
     on conflict(id) do update set ${set}`,
    values,
  );
  if (cfg.name === "categories") {
    const key = defaultKeyById.get(r.id as string);
    if (key) db.runSync("update categories set key = ? where id = ? and key is null", [key, r.id as string]);
  }
  return true;
}

async function pullAll(): Promise<boolean> {
  const db = getDb();
  let changed = false;
  for (const cfg of TABLES) {
    let cur: Cursor | null = overlapCursor(loadCursor(cfg.name));
    for (;;) {
      let q = supabase!
        .from(cfg.name)
        .select([...cfg.cols, "updated_at"].join(","))
        .order("updated_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(PAGE);
      if (cur) q = q.or(keysetFilter(cur));
      const { data, error } = await q;
      if (error) throw new Error(`pull ${cfg.name}: ${error.message}`);
      const page = (data ?? []) as unknown as Row[];
      if (page.length === 0) break;

      db.withTransactionSync(() => {
        for (const r of page) if (applyRemote(cfg, r)) changed = true;
      });
      const last = page[page.length - 1]!;
      cur = { updatedAt: last.updated_at as string, id: last.id as string };
      saveCursor(cfg.name, cur);
      if (page.length < PAGE) break;
    }
  }
  return changed;
}

/* ---------- stanje za prikaz (Profil) ---------- */

export type SyncState = "local" | "idle" | "syncing" | "waiting";

export interface SyncStatus {
  state: SyncState; // local: bez računa/okruženja; waiting: izmjene čekaju mrežu
  lastAt: string | null; // zadnja uspješna sinkronizacija (ISO)
  pending: number; // izmijenjenih redaka koji još nisu poslani
}

let status: SyncStatus = { state: "local", lastAt: null, pending: 0 };
const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

function pendingCount(): number {
  return (
    getDb().getFirstSync<{ n: number }>("select count(*) as n from (select 1 from outbox group by table_name, row_id)")?.n ?? 0
  );
}

/** Sinkronizacija je nevidljiva dok sve radi; Profil prikazuje ovo stanje. */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status,
    () => status,
  );
}

/* ---------- upravljanje ---------- */

let running = false;
let again = false;
let failures = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function schedule(ms: number): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, ms);
}

/** Jedan krug: push pa pull. Tiho preskače bez konfiguracije ili sesije; pri grešci pokušava s odgodom. */
export async function syncNow(): Promise<void> {
  if (!supabase) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus({ state: "local", pending: pendingCount() });
      return;
    }
    setStatus({ state: "syncing", pending: pendingCount() });
    await pushAll();
    if (await pullAll()) notifyDbChanged();
    failures = 0;
    const at = new Date().toISOString();
    getDb().runSync(
      "insert into kv (key, value) values ('sync.lastAt', ?) on conflict(key) do update set value = excluded.value",
      [at],
    );
    setStatus({ state: "idle", lastAt: at, pending: pendingCount() });
  } catch (e) {
    failures += 1;
    setStatus({ state: "waiting", pending: pendingCount() });
    if (__DEV__) console.warn("[sync]", e instanceof Error ? e.message : e);
    schedule(backoffSeconds(failures) * 1000);
  } finally {
    running = false;
    if (again) {
      again = false;
      schedule(500);
    }
  }
}

/** Pokreće sinkronizaciju: nakon sesije, nakon svake izmjene (odgoda 2 s), pri povratku u aplikaciju i svakih 5 min. */
export function startSync(): () => void {
  if (!supabase) return () => undefined;
  status = { ...status, lastAt: kvGet("sync.lastAt"), pending: pendingCount() };
  setSyncHandler(() => {
    setStatus({ pending: pendingCount(), state: status.state === "local" ? "local" : "waiting" });
    schedule(2000);
  });
  const sub = AppState.addEventListener("change", (s) => {
    if (s === "active") schedule(500);
  });
  const interval = setInterval(() => schedule(0), 5 * 60 * 1000);
  void ensureAnonymousSession().then(() => schedule(0));
  return () => {
    sub.remove();
    clearInterval(interval);
    setSyncHandler(null);
    if (timer) clearTimeout(timer);
  };
}
