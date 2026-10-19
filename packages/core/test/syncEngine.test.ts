import { describe, expect, it } from "vitest";
import {
  SYNC_TABLES,
  pullAll,
  pushAll,
  type Cursor,
  type LocalStore,
  type RemoteStore,
  type Row,
  type TableCfg,
} from "../src";

/* ---------- lažna poslužiteljska strana (ista pravila kao sync_push) ---------- */

class FakeServer {
  tables = new Map<string, Map<string, Row>>();
  now = Date.parse("2026-10-16T10:00:00.000Z");
  pushLog: string[] = [];
  failNextPush = false;

  advance(ms: number) {
    this.now += ms;
  }
  private t(table: string) {
    if (!this.tables.has(table)) this.tables.set(table, new Map());
    return this.tables.get(table)!;
  }
  /** Vrijednost kao Postgres: sve unutar jednog poziva dijeli isti updated_at (now()). */
  push = async (table: string, rows: Row[]) => {
    if (this.failNextPush) {
      this.failNextPush = false;
      throw new Error("mreža");
    }
    this.pushLog.push(table);
    const stamp = new Date(this.now).toISOString();
    for (const r of rows) {
      const cur = this.t(table).get(r.id as string);
      const a = [Date.parse(r.client_updated_at as string), Number(r.rev)];
      const b = cur ? [Date.parse(cur.client_updated_at as string), Number(cur.rev)] : [-Infinity, -Infinity];
      if (!cur || a[0]! > b[0]! || (a[0] === b[0] && a[1]! > b[1]!)) this.t(table).set(r.id as string, { ...r, updated_at: stamp });
    }
  };
  pull = async (table: string, after: Cursor | null, limit: number) => {
    const all = [...this.t(table).values()].sort((x, y) => {
      const ux = Date.parse(x.updated_at as string);
      const uy = Date.parse(y.updated_at as string);
      return ux !== uy ? ux - uy : (x.id as string) < (y.id as string) ? -1 : 1;
    });
    const out = after
      ? all.filter((r) => {
          const u = Date.parse(r.updated_at as string);
          const au = Date.parse(after.updatedAt);
          return u > au || (u === au && (r.id as string) > after.id);
        })
      : all;
    return out.slice(0, limit);
  };
  /** Redak koji postaje vidljiv „kasno“ s već starim updated_at (transakcija potvrđena izvan redoslijeda). */
  commitLate(table: string, row: Row, updatedAt: string) {
    this.t(table).set(row.id as string, { ...row, updated_at: updatedAt });
  }
  get(table: string, id: string) {
    return this.t(table).get(id);
  }
}

/* ---------- lažna lokalna strana (uređaj) ---------- */

class FakeDevice implements LocalStore {
  rows = new Map<string, Map<string, Row>>();
  outbox: { seq: number; table: string; rowId: string }[] = [];
  cursors = new Map<string, Cursor>();
  private seq = 0;
  private clock: () => number;
  /** Poziva se usred slanja (simulira izmjenu dok je zahtjev u tijeku). */
  duringPush?: () => void;

  constructor(clock: () => number) {
    this.clock = clock;
  }
  private t(table: string) {
    if (!this.rows.has(table)) this.rows.set(table, new Map());
    return this.rows.get(table)!;
  }
  /** Korisnička izmjena: novi client_updated_at i rev + 1, zapis u outbox. */
  edit(table: string, base: Row, at?: number) {
    const cur = this.t(table).get(base.id as string);
    const row: Row = { ...(cur ?? {}), ...base, client_updated_at: new Date(at ?? this.clock()).toISOString(), rev: cur ? Number(cur.rev) + 1 : 0 };
    if (!row.created_at) row.created_at = row.client_updated_at;
    this.t(table).set(row.id as string, row);
    this.outbox.push({ seq: ++this.seq, table, rowId: row.id as string });
  }
  get(table: string, id: string) {
    return this.t(table).get(id);
  }
  pending(table: string, limit: number) {
    const by = new Map<string, { min: number; max: number }>();
    for (const o of this.outbox) {
      if (o.table !== table) continue;
      const e = by.get(o.rowId);
      by.set(o.rowId, e ? { min: e.min, max: o.seq } : { min: o.seq, max: o.seq });
    }
    return [...by.entries()]
      .sort((a, b) => a[1].min - b[1].min)
      .slice(0, limit)
      .map(([rowId, v]) => ({ rowId, seq: v.max }));
  }
  read(table: string, cols: string[], ids: string[]) {
    const out = ids
      .map((id) => this.t(table).get(id))
      .filter((r): r is Row => !!r)
      .map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
    if (table === "transactions") this.duringPush?.(); // izmjena nakon čitanja, a prije potvrde slanja
    return out;
  }
  ack(table: string, rowId: string, upToSeq: number) {
    this.outbox = this.outbox.filter((o) => !(o.table === table && o.rowId === rowId && o.seq <= upToSeq));
  }
  stamp(table: string, id: string) {
    const r = this.t(table).get(id);
    return r ? { clientUpdatedAt: r.client_updated_at as string, rev: Number(r.rev) } : null;
  }
  apply(cfg: TableCfg, row: Row) {
    this.t(cfg.name).set(row.id as string, { ...row });
  }
  getCursor(table: string) {
    return this.cursors.get(table) ?? null;
  }
  setCursor(table: string, c: Cursor) {
    this.cursors.set(table, c);
  }
  transaction<T>(fn: () => T): T {
    return fn();
  }
}

const remoteOf = (s: FakeServer): RemoteStore => ({ push: s.push, pull: s.pull });
const T0 = Date.parse("2026-10-16T10:00:00.000Z");
const CAT = "11111111-1111-4111-8111-111111111111";

const cat = (name: string, extra: Row = {}): Row => ({
  id: CAT, name, icon: "cart", color_token: "cat-hrana", sort: 0, is_system: 0, archived: 0, deleted_at: null, ...extra,
});
const tx = (n: number, extra: Row = {}): Row => ({
  id: `22222222-2222-4222-8222-${String(n).padStart(12, "0")}`,
  amount_cents: 1000 + n, type: "expense", category_id: CAT, note: null, merchant: null, local_date: "2026-10-16",
  occurred_at: "2026-10-16T10:00:00.000Z", source: "manual", receipt_id: null, recurring_id: null, deleted_at: null, ...extra,
});

async function sync(d: FakeDevice, s: FakeServer, page = 500, batch = 100) {
  await pushAll(d, remoteOf(s), SYNC_TABLES, batch);
  return pullAll(d, remoteOf(s), SYNC_TABLES, page);
}

describe("sync motor", () => {
  it("dva uređaja: izmjena s jednog stiže na drugi (roditelji prije djece)", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    const b = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1));
    await sync(a, s);
    expect(s.pushLog).toEqual(["categories", "transactions"]);

    s.advance(1000);
    const changed = await sync(b, s);
    expect(changed).toBe(true);
    expect(b.get("categories", CAT)?.name).toBe("Hrana");
    expect(b.get("transactions", tx(1).id as string)?.amount_cents).toBe(1001);
    expect(b.outbox).toHaveLength(0); // primljeno ne ide natrag u outbox
    now += 1;
  });

  it("outbox spaja uzastopne izmjene istog retka i šalje samo zadnje stanje", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    for (let i = 1; i <= 5; i++) {
      now += 10;
      a.edit("transactions", tx(1, { amount_cents: i * 100 }));
    }
    await pushAll(a, remoteOf(s));
    expect(s.get("transactions", tx(1).id as string)?.amount_cents).toBe(500);
    expect(s.pushLog.filter((t) => t === "transactions")).toHaveLength(1);
    expect(a.outbox).toHaveLength(0);
  });

  it("offline sukob: novija izmjena pobjeđuje bez obzira na redoslijed slanja", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    const b = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1, { amount_cents: 1000 }));
    await sync(a, s);
    s.advance(1000);
    await sync(b, s);

    // oba uređaja izmijene isti trošak offline; B kasnije (novije)
    a.edit("transactions", tx(1, { amount_cents: 1111 }), T0 + 60_000);
    b.edit("transactions", tx(1, { amount_cents: 2222 }), T0 + 120_000);
    s.advance(5000);
    await pushAll(b, remoteOf(s)); // B šalje prvi
    s.advance(5000);
    await pushAll(a, remoteOf(s)); // A šalje poslije, ali je starija izmjena: ne smije prepisati
    expect(s.get("transactions", tx(1).id as string)?.amount_cents).toBe(2222);

    s.advance(5000);
    await sync(a, s);
    await sync(b, s);
    expect(a.get("transactions", tx(1).id as string)?.amount_cents).toBe(2222);
    expect(b.get("transactions", tx(1).id as string)?.amount_cents).toBe(2222);
  });

  it("brisanje (meko) se širi, a novije vraćanje pobjeđuje brisanje", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    const b = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1));
    await sync(a, s);
    s.advance(1000);
    await sync(b, s);

    now = T0 + 10_000;
    a.edit("transactions", tx(1, { deleted_at: new Date(now).toISOString() }));
    s.advance(1000);
    await sync(a, s);
    s.advance(1000);
    await sync(b, s);
    expect(b.get("transactions", tx(1).id as string)?.deleted_at).not.toBeNull();

    now = T0 + 20_000; // „Poništi“ na uređaju B (novije)
    b.edit("transactions", tx(1, { deleted_at: null }));
    s.advance(1000);
    await sync(b, s);
    s.advance(1000);
    await sync(a, s);
    expect(a.get("transactions", tx(1).id as string)?.deleted_at).toBeNull();
  });

  it("povlačenje po stranicama: svi retci s istim updated_at stignu (tiebreak po id)", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    const b = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    for (let i = 1; i <= 23; i++) a.edit("transactions", tx(i));
    await sync(a, s); // svih 23 retka u jednom pozivu => isti updated_at
    s.advance(1000);
    await sync(b, s, 5); // stranice po 5
    for (let i = 1; i <= 23; i++) expect(b.get("transactions", tx(i).id as string)).toBeTruthy();
    expect(b.cursors.get("transactions")?.id).toBeTruthy();
  });

  it("preklop od 5 s hvata redak koji postane vidljiv izvan redoslijeda", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    const b = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1));
    await sync(a, s);
    s.advance(10_000);
    await sync(b, s); // kursor je sad na updated_at ≈ T0

    // transakcija koja je počela ranije potvrđuje se tek sad, s updated_at 3 s prije kursora
    const late = { ...tx(2), client_updated_at: new Date(T0).toISOString(), rev: 0, created_at: new Date(T0).toISOString() };
    s.commitLate("transactions", late, new Date(T0 - 3000).toISOString());
    s.advance(1000);
    await sync(b, s);
    expect(b.get("transactions", tx(2).id as string)).toBeTruthy();
  });

  it("greška mreže ne gubi izmjene: outbox ostaje, ponovni pokušaj uspijeva", async () => {
    const s = new FakeServer();
    const a = new FakeDevice(() => T0);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1));
    s.failNextPush = true;
    await expect(pushAll(a, remoteOf(s))).rejects.toThrow("mreža");
    expect(a.outbox.length).toBe(2);
    await pushAll(a, remoteOf(s));
    expect(a.outbox).toHaveLength(0);
    expect(s.get("transactions", tx(1).id as string)).toBeTruthy();
  });

  it("izmjena tijekom slanja ostaje u outboxu i ode u sljedećem krugu", async () => {
    const s = new FakeServer();
    let now = T0;
    const a = new FakeDevice(() => now);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1, { amount_cents: 100 }));
    let injected = false;
    a.duringPush = () => {
      if (injected) return;
      injected = true;
      now += 50;
      a.edit("transactions", tx(1, { amount_cents: 999 })); // korisnik mijenja dok traje slanje
    };
    await pushAll(a, remoteOf(s));
    // ack briše samo do poslane oznake: novija izmjena je još tu
    expect(a.outbox.some((o) => o.table === "transactions")).toBe(true);
    await pushAll(a, remoteOf(s));
    expect(s.get("transactions", tx(1).id as string)?.amount_cents).toBe(999);
    expect(a.outbox).toHaveLength(0);
  });

  it("pull je idempotentan: ponovljeno povlačenje ništa ne mijenja", async () => {
    const s = new FakeServer();
    const a = new FakeDevice(() => T0);
    const b = new FakeDevice(() => T0);
    a.edit("categories", cat("Hrana"));
    a.edit("transactions", tx(1));
    await sync(a, s);
    s.advance(1000);
    expect(await sync(b, s)).toBe(true);
    expect(await sync(b, s)).toBe(false); // isto stanje: nema promjena
    // vlastiti odjek: A povlači svoje retke, ali oni su jednaki lokalnima
    expect(await sync(a, s)).toBe(false);
  });

  it("logički tipovi i vremena se pretvaraju na granici (0/1 ↔ boolean, ISO)", async () => {
    const s = new FakeServer();
    const a = new FakeDevice(() => T0);
    const b = new FakeDevice(() => T0);
    a.edit("categories", cat("Hrana", { is_system: 1, archived: 0 }));
    await pushAll(a, remoteOf(s));
    expect(s.get("categories", CAT)?.is_system).toBe(true);
    expect(s.get("categories", CAT)?.archived).toBe(false);
    // poslužitelj vraća vrijeme kao Postgres ("+00:00"): lokalno mora postati ISO s "Z"
    s.get("categories", CAT)!.client_updated_at = "2026-10-16T10:00:00+00:00";
    s.advance(1000);
    await pullAll(b, remoteOf(s));
    expect(b.get("categories", CAT)?.is_system).toBe(1);
    expect(b.get("categories", CAT)?.client_updated_at).toBe("2026-10-16T10:00:00.000Z");
  });
});
