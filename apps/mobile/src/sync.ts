import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import {
  DEFAULT_CATEGORIES,
  SYNC_TABLES,
  backoffSeconds,
  keysetFilter,
  pullAll as enginePull,
  pushAll as enginePush,
  uuidV5,
  type Cursor,
  type LocalStore,
  type RemoteStore,
  type Row,
} from "@unitcent/core";
import { getDb } from "./db/client";
import { notifyDbChanged } from "./db/events";
import { kvGet } from "./db/repo";
import { setSyncHandler } from "./db/syncSignal";
import { refreshEntitlement } from "./premium";
import { refreshScanUsage } from "./scanQuota";
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

const defaultKeyById = new Map(DEFAULT_CATEGORIES.map((c) => [uuidV5(`category:${c.key}`, PLAN_NAMESPACE), c.key]));

/** Lokalna pohrana motora: expo-sqlite (outbox, retci, kursori u kv). */
const localStore: LocalStore = {
  pending: (table, limit) =>
    getDb()
      .getAllSync<{ row_id: string; seq: number }>(
        "select row_id, max(seq) as seq from outbox where table_name = ? group by row_id order by min(seq) limit ?",
        [table, limit],
      )
      .map((r) => ({ rowId: r.row_id, seq: r.seq })),
  read: (table, cols, ids) =>
    getDb().getAllSync<Row>(`select ${cols.join(", ")} from ${table} where id in (${ids.map(() => "?").join(",")})`, ids),
  ack: (table, rowId, upToSeq) => {
    getDb().runSync("delete from outbox where table_name = ? and row_id = ? and seq <= ?", [table, rowId, upToSeq]);
  },
  stamp: (table, id) => {
    const r = getDb().getFirstSync<{ client_updated_at: string; rev: number }>(
      `select client_updated_at, rev from ${table} where id = ?`,
      [id],
    );
    return r ? { clientUpdatedAt: r.client_updated_at, rev: r.rev } : null;
  },
  apply: (cfg, row) => {
    const cols = [...cfg.cols, "updated_at"];
    const set = cols.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
    const db = getDb();
    db.runSync(
      `insert into ${cfg.name} (${cols.join(", ")}) values (${cols.map(() => "?").join(", ")})
       on conflict(id) do update set ${set}`,
      cols.map((c) => row[c] as string | number | null),
    );
    if (cfg.name === "categories") {
      const key = defaultKeyById.get(row.id as string);
      if (key) db.runSync("update categories set key = ? where id = ? and key is null", [key, row.id as string]);
    }
  },
  getCursor: (table) => {
    const raw = kvGet(`sync.cursor.${table}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Cursor;
    } catch {
      return null;
    }
  },
  setCursor: (table, c) => {
    // Izravno u bazu: kvSet bi bez potrebe osvježavao zaslone.
    getDb().runSync("insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", [
      `sync.cursor.${table}`,
      JSON.stringify(c),
    ]);
  },
  transaction: (fn) => {
    let out!: ReturnType<typeof fn>;
    getDb().withTransactionSync(() => {
      out = fn();
    });
    return out;
  },
};

/** Udaljena pohrana motora: Supabase (RPC `sync_push` za slanje, tablice za povlačenje). */
const remoteStore: RemoteStore = {
  push: async (table, rows) => {
    const { error } = await supabase!.rpc("sync_push", { p_table: table, p_op: "upsert", p_rows: rows });
    if (error) throw new Error(`sync_push ${table}: ${error.message}`);
  },
  pull: async (table, after, limit) => {
    const cfg = SYNC_TABLES.find((t) => t.name === table)!;
    let q = supabase!
      .from(table)
      .select([...cfg.cols, "updated_at"].join(","))
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(limit);
    if (after) q = q.or(keysetFilter(after));
    const { data, error } = await q;
    if (error) throw new Error(`pull ${table}: ${error.message}`);
    return (data ?? []) as unknown as Row[];
  },
};

const pushAll = () => enginePush(localStore, remoteStore, SYNC_TABLES, BATCH);
const pullAll = () => enginePull(localStore, remoteStore, SYNC_TABLES, PAGE);

/**
 * Poziva se kad se promijeni korisnik (prijava u postojeći račun): kursori kreću ispočetka,
 * a svi lokalni reci ponovno idu u outbox da se dodaju novom računu (ID-evi su jedinstveni po korisniku).
 */
export function resetSyncState(): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync("delete from kv where key like 'sync.cursor.%'");
    db.runSync("delete from outbox");
    const t = new Date().toISOString();
    for (const cfg of SYNC_TABLES) {
      db.runSync(
        `insert into outbox (table_name, row_id, op, payload, created_at) select ?, id, 'upsert', '{}', ? from ${cfg.name}`,
        [cfg.name, t],
      );
    }
  });
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

/** Broj izmijenjenih redaka koji još nisu poslani na poslužitelj. */
export function pendingCount(): number {
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
    void refreshEntitlement();
    void refreshScanUsage();
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
