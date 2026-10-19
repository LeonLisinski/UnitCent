import * as Crypto from "expo-crypto";
import {
  DEFAULT_CATEGORIES,
  bookingId,
  occurrenceDate,
  parseAmount,
  summarizeMonth,
  todayInZone,
  uuidV5,
  uuidV7,
  yearMonthOf,
  previousMonth,
  type Cents,
  type LimitResult,
  type LocalDate,
  type RecurringItem,
  type TxLike,
  type YearMonth,
} from "@unitcent/core";
import { getDb } from "./client";
import { notifyDbChanged } from "./events";
import { requestSync } from "./syncSignal";

/* ---------- pomoćno ---------- */

const PLAN_NAMESPACE = "9b0c1e52-7d1a-4f6b-8a3c-5e2d4f7a9c10";

export const newId = (): string => uuidV7(Date.now(), (n) => Crypto.getRandomBytes(n));
export const nowIso = (): string => new Date().toISOString();
export const today = (): LocalDate => todayInZone(new Date(), "Europe/Zagreb");

/** Zapis u outbox (u istoj transakciji kao i podatak). */
function enqueue(table: string, rowId: string, op: "upsert" | "delete", payload: unknown): void {
  getDb().runSync(
    "insert into outbox (table_name, row_id, op, payload, created_at) values (?, ?, ?, ?, ?)",
    [table, rowId, op, JSON.stringify(payload), nowIso()],
  );
  requestSync();
}

/* ---------- tipovi ---------- */

export interface Category {
  id: string;
  key: string | null;
  name: string;
  icon: string;
  colorToken: string;
  sort: number;
}

export interface Transaction {
  id: string;
  amountCents: Cents;
  type: "expense" | "income";
  categoryId: string | null;
  note: string | null;
  merchant: string | null;
  localDate: LocalDate;
  occurredAt: string;
  source: "manual" | "scan" | "recurring";
  recurringId: string | null;
}

export interface MonthPlan {
  month: YearMonth;
  incomeCents: Cents;
  savingsCents: Cents;
}

/* ---------- kv (postavke) ---------- */

export function kvGet(key: string): string | null {
  return getDb().getFirstSync<{ value: string }>("select value from kv where key = ?", [key])?.value ?? null;
}

export function kvSet(key: string, value: string): void {
  getDb().runSync(
    "insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
    [key, value],
  );
  notifyDbChanged();
}

/* ---------- kategorije ---------- */

/** Stvara zadane kategorije pri prvom pokretanju (idempotentno). */
export function ensureCategories(): void {
  const db = getDb();
  const have = db.getFirstSync<{ n: number }>("select count(*) as n from categories")?.n ?? 0;
  if (have > 0) return;
  const t = nowIso();
  // Zadane kategorije imaju "najstariju" izmjenu: ako ih je korisnik već preimenovao na drugom
  // uređaju, ta izmjena pobjeđuje pri sinkronizaciji, a ne svježe zadane vrijednosti.
  const EPOCH = "1970-01-01T00:00:00.000Z";
  db.withTransactionSync(() => {
    DEFAULT_CATEGORIES.forEach((c, i) => {
      // Deterministički ID po ključu: isti na svim uređajima, pa se sync ne udvostruči.
      const id = uuidV5(`category:${c.key}`, PLAN_NAMESPACE);
      db.runSync(
        `insert or ignore into categories (id, key, name, icon, color_token, sort, is_system, created_at, client_updated_at)
         values (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, c.key, c.name, c.icon, c.colorToken, i, t, EPOCH],
      );
      enqueue("categories", id, "upsert", {
        id, key: c.key, name: c.name, icon: c.icon, color_token: c.colorToken, sort: i, is_system: true, client_updated_at: EPOCH,
      });
    });
  });
  notifyDbChanged();
}

export function listCategories(): Category[] {
  return getDb()
    .getAllSync<{ id: string; key: string | null; name: string; icon: string; color_token: string; sort: number }>(
      "select id, key, name, icon, color_token, sort from categories where deleted_at is null and archived = 0 order by sort, name",
    )
    .map((r) => ({ id: r.id, key: r.key, name: r.name, icon: r.icon, colorToken: r.color_token, sort: r.sort }));
}

/** Kategorije poredane po učestalosti korištenja (najčešće prve), za brzi unos. */
export function listCategoriesByUsage(): Category[] {
  return getDb()
    .getAllSync<{ id: string; key: string | null; name: string; icon: string; color_token: string; sort: number }>(
      `select c.id, c.key, c.name, c.icon, c.color_token, c.sort
         from categories c
         left join (select category_id, count(*) n from transactions where deleted_at is null and type = 'expense' group by category_id) u
           on u.category_id = c.id
        where c.deleted_at is null and c.archived = 0
        order by coalesce(u.n, 0) desc, c.sort`,
    )
    .map((r) => ({ id: r.id, key: r.key, name: r.name, icon: r.icon, colorToken: r.color_token, sort: r.sort }));
}

export function getCategory(id: string): Category | null {
  const r = getDb().getFirstSync<{ id: string; key: string | null; name: string; icon: string; color_token: string; sort: number }>(
    "select id, key, name, icon, color_token, sort from categories where id = ? and deleted_at is null",
    [id],
  );
  return r ? { id: r.id, key: r.key, name: r.name, icon: r.icon, colorToken: r.color_token, sort: r.sort } : null;
}

function enqueueCategory(id: string): void {
  const r = getDb().getFirstSync<Record<string, unknown>>("select * from categories where id = ?", [id]);
  if (r) enqueue("categories", id, "upsert", r);
}

/** Korisnička kategorija (ikona i boja iz ponuđenog skupa). */
export function addCategory(input: { name: string; icon: string; colorToken: string }): Category {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  const sort = (db.getFirstSync<{ m: number | null }>("select max(sort) as m from categories")?.m ?? 0) + 1;
  db.withTransactionSync(() => {
    db.runSync(
      `insert into categories (id, key, name, icon, color_token, sort, is_system, created_at, client_updated_at)
       values (?, null, ?, ?, ?, ?, 0, ?, ?)`,
      [id, input.name.trim(), input.icon, input.colorToken, sort, t, t],
    );
    enqueueCategory(id);
  });
  notifyDbChanged();
  return { id, key: null, name: input.name.trim(), icon: input.icon, colorToken: input.colorToken, sort };
}

export function updateCategory(id: string, input: { name: string; icon: string; colorToken: string }): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync(
      "update categories set name = ?, icon = ?, color_token = ?, client_updated_at = ?, rev = rev + 1 where id = ?",
      [input.name.trim(), input.icon, input.colorToken, t, id],
    );
    enqueueCategory(id);
  });
  notifyDbChanged();
}

/** Meko brisanje: stari troškovi ostaju (bez kategorije), a kategorija nestaje s popisa. */
export function deleteCategory(id: string): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync("update categories set deleted_at = ?, client_updated_at = ?, rev = rev + 1 where id = ?", [t, t, id]);
    enqueueCategory(id);
  });
  notifyDbChanged();
}

export function restoreCategory(id: string): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync("update categories set deleted_at = null, client_updated_at = ?, rev = rev + 1 where id = ?", [t, id]);
    enqueueCategory(id);
  });
  notifyDbChanged();
}

/* ---------- transakcije ---------- */

type TxRow = {
  id: string; amount_cents: number; type: "expense" | "income"; category_id: string | null; note: string | null;
  merchant: string | null; local_date: string; occurred_at: string; source: Transaction["source"]; recurring_id: string | null;
};
const mapTx = (r: TxRow): Transaction => ({
  id: r.id, amountCents: r.amount_cents, type: r.type, categoryId: r.category_id, note: r.note, merchant: r.merchant,
  localDate: r.local_date, occurredAt: r.occurred_at, source: r.source, recurringId: r.recurring_id,
});

export function addTransaction(input: {
  amountCents: Cents;
  type?: "expense" | "income";
  categoryId: string | null;
  note?: string;
  localDate?: LocalDate;
  source?: "manual" | "scan";
  merchant?: string | null;
}): Transaction {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  const row = {
    id,
    amount_cents: Math.round(input.amountCents),
    type: input.type ?? "expense",
    category_id: input.categoryId,
    note: input.note?.trim() ? input.note.trim() : null,
    merchant: input.merchant ?? null,
    local_date: input.localDate ?? today(),
    occurred_at: t,
    source: input.source ?? ("manual" as const),
    recurring_id: null as string | null,
  };
  db.withTransactionSync(() => {
    db.runSync(
      `insert into transactions (id, amount_cents, type, category_id, note, merchant, local_date, occurred_at, source, recurring_id, created_at, client_updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.amount_cents, row.type, row.category_id, row.note, row.merchant, row.local_date, row.occurred_at, row.source, row.recurring_id, t, t],
    );
    enqueue("transactions", id, "upsert", { ...row, client_updated_at: t });
  });
  notifyDbChanged();
  return mapTx(row);
}

/** Meko brisanje (omogućuje „Poništi“ i sinkronizaciju brisanja). */
export function deleteTransaction(id: string): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync("update transactions set deleted_at = ?, client_updated_at = ?, rev = rev + 1 where id = ?", [t, t, id]);
    enqueue("transactions", id, "delete", { id, deleted_at: t, client_updated_at: t });
  });
  notifyDbChanged();
}

export function restoreTransaction(id: string): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync("update transactions set deleted_at = null, client_updated_at = ?, rev = rev + 1 where id = ?", [t, id]);
    const r = db.getFirstSync<TxRow>("select * from transactions where id = ?", [id]);
    if (r) enqueue("transactions", id, "upsert", { ...r, deleted_at: null, client_updated_at: t });
  });
  notifyDbChanged();
}

export function listTransactionsInMonth(month: YearMonth): Transaction[] {
  return getDb()
    .getAllSync<TxRow>(
      "select * from transactions where deleted_at is null and local_date >= ? and local_date <= ? order by local_date desc, occurred_at desc",
      [`${month}-01`, `${month}-31`],
    )
    .map(mapTx);
}

/**
 * „Zadnje“ na početnoj: zadnje UNESENO (ne zadnje po datumu), pa račun ili trošak unesen sad s datumom iz prošlosti
 * ostaje na vrhu. Automatska knjiženja pretplata ulaze samo ako su svježa (zadnja 3 dana), da ne preplave popis.
 */
export function listRecentTransactions(limit = 8): Transaction[] {
  return getDb()
    .getAllSync<TxRow>(
      `select * from transactions
        where deleted_at is null and (source != 'recurring' or local_date >= date('now', '-3 day'))
        order by created_at desc, id desc limit ?`,
      [limit],
    )
    .map(mapTx);
}

/** Pretraga i filtriranje troškova: po mjesecu, kategoriji i tekstu (bilješka, trgovina, kategorija ili iznos). */
export function searchTransactions(opts: {
  month?: YearMonth | null;
  categoryId?: string | "none" | null;
  query?: string;
  limit?: number;
}): Transaction[] {
  const where = ["t.deleted_at is null"];
  const args: (string | number)[] = [];
  if (opts.month) {
    where.push("t.local_date >= ? and t.local_date <= ?");
    args.push(`${opts.month}-01`, `${opts.month}-31`);
  }
  if (opts.categoryId === "none") where.push("t.category_id is null");
  else if (opts.categoryId) {
    where.push("t.category_id = ?");
    args.push(opts.categoryId);
  }
  const q = opts.query?.trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const cents = parseAmount(q);
    const parts = ["t.note like ?", "t.merchant like ?", "c.name like ?"];
    args.push(like, like, like);
    if (cents) {
      parts.push("t.amount_cents = ?");
      args.push(cents);
    }
    where.push(`(${parts.join(" or ")})`);
  }
  return getDb()
    .getAllSync<TxRow>(
      `select t.* from transactions t left join categories c on c.id = t.category_id
        where ${where.join(" and ")}
        order by t.local_date desc, t.occurred_at desc limit ?`,
      [...args, opts.limit ?? 300],
    )
    .map(mapTx);
}

export function getTransaction(id: string): Transaction | null {
  const r = getDb().getFirstSync<TxRow>("select * from transactions where id = ? and deleted_at is null", [id]);
  return r ? mapTx(r) : null;
}

export function updateTransaction(
  id: string,
  input: { amountCents: Cents; type: "expense" | "income"; categoryId: string | null; note?: string; localDate?: LocalDate },
): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync(
      `update transactions set amount_cents = ?, type = ?, category_id = ?, note = ?,
         local_date = coalesce(?, local_date), client_updated_at = ?, rev = rev + 1 where id = ?`,
      [Math.round(input.amountCents), input.type, input.categoryId, input.note?.trim() ? input.note.trim() : null, input.localDate ?? null, t, id],
    );
    const r = db.getFirstSync<TxRow>("select * from transactions where id = ?", [id]);
    if (r) enqueue("transactions", id, "upsert", r);
  });
  notifyDbChanged();
}

/* ---------- plan mjeseca ---------- */

export function getPlan(month: YearMonth): MonthPlan | null {
  const r = getDb().getFirstSync<{ month: string; income_cents: number; savings_cents: number }>(
    "select month, income_cents, savings_cents from month_plans where month = ? and deleted_at is null",
    [month],
  );
  return r ? { month: r.month, incomeCents: r.income_cents, savingsCents: r.savings_cents } : null;
}

/** Najnoviji plan prije zadanog mjeseca (novi mjesec nasljeđuje primanja i štednju). */
export function getLatestPlanBefore(month: YearMonth): MonthPlan | null {
  const r = getDb().getFirstSync<{ month: string; income_cents: number; savings_cents: number }>(
    "select month, income_cents, savings_cents from month_plans where month < ? and deleted_at is null order by month desc limit 1",
    [month],
  );
  return r ? { month: r.month, incomeCents: r.income_cents, savingsCents: r.savings_cents } : null;
}

export function upsertPlan(plan: MonthPlan): void {
  const db = getDb();
  const id = uuidV5(`plan:${plan.month}`, PLAN_NAMESPACE);
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync(
      `insert into month_plans (id, month, income_cents, savings_cents, created_at, client_updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict(month) do update set income_cents = excluded.income_cents, savings_cents = excluded.savings_cents,
         client_updated_at = excluded.client_updated_at, rev = rev + 1, deleted_at = null`,
      [id, plan.month, plan.incomeCents, plan.savingsCents, t, t],
    );
    enqueue("month_plans", id, "upsert", {
      id, month: plan.month, income_cents: plan.incomeCents, savings_cents: plan.savingsCents, client_updated_at: t,
    });
  });
  notifyDbChanged();
}

/* ---------- pretplate i fiksni troškovi ---------- */

type RecRow = {
  id: string; name: string; amount_cents: number; day_of_month: number; category_id: string | null;
  active: number; start_date: string; end_date: string | null; icon_key: string | null;
};
export interface RecurringRecord extends RecurringItem {
  categoryId: string | null;
  iconKey: string | null;
}
const mapRec = (r: RecRow): RecurringRecord => ({
  id: r.id, name: r.name, amountCents: r.amount_cents, dayOfMonth: r.day_of_month, active: r.active === 1,
  startDate: r.start_date, endDate: r.end_date, categoryId: r.category_id, iconKey: r.icon_key,
});

export function listRecurring(): RecurringRecord[] {
  return getDb()
    .getAllSync<RecRow>("select * from recurring_items where deleted_at is null order by day_of_month, name")
    .map(mapRec);
}

export function addRecurring(input: {
  name: string;
  amountCents: Cents;
  dayOfMonth: number;
  categoryId: string | null;
  iconKey?: string | null;
  startDate?: LocalDate;
  endDate?: LocalDate | null;
}): RecurringRecord {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  const row = {
    id, name: input.name.trim(), amount_cents: Math.round(input.amountCents),
    day_of_month: Math.min(31, Math.max(1, Math.round(input.dayOfMonth))),
    category_id: input.categoryId, active: 1,
    // Zadano od 1. u mjesecu: stavka s već prošlim danom odmah se knjiži i ulazi u „obavezno”.
    start_date: input.startDate ?? `${yearMonthOf(today())}-01`, end_date: (input.endDate ?? null) as string | null,
    icon_key: input.iconKey ?? null,
  };
  db.withTransactionSync(() => {
    db.runSync(
      `insert into recurring_items (id, name, amount_cents, day_of_month, category_id, active, start_date, end_date, icon_key, created_at, client_updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.name, row.amount_cents, row.day_of_month, row.category_id, row.active, row.start_date, row.end_date, row.icon_key, t, t],
    );
    enqueue("recurring_items", id, "upsert", { ...row, active: true, client_updated_at: t });
  });
  reconcileBookings(id); // stavka s početkom u prošlosti knjiži i prošle mjesece (povijest je točna)
  notifyDbChanged();
  return mapRec(row);
}

/**
 * Usklađuje knjiženja pretplate s njezinim razdobljem (početak/kraj):
 *  - knjiženja izvan razdoblja (prije početka ili nakon kraja) se meko brišu;
 *  - za svaki mjesec u razdoblju do danas koji nema knjiženje, stvara se jedno (deterministički ID, pa je sigurno ponoviti).
 * Dan u mjesecu i iznos se ne primjenjuju unatrag na već knjižene mjesece.
 */
export function reconcileBookings(id: string, todayDate: LocalDate = today()): void {
  const db = getDb();
  const it = getRecurring(id);
  if (!it) return;
  const t = nowIso();
  db.withTransactionSync(() => {
    const rows = db.getAllSync<{ id: string; local_date: string }>(
      "select id, local_date from transactions where recurring_id = ? and source = 'recurring' and deleted_at is null",
      [id],
    );
    for (const r of rows) {
      const outside = r.local_date < it.startDate || (it.endDate != null && r.local_date > it.endDate);
      if (!outside) continue;
      db.runSync("update transactions set deleted_at = ?, client_updated_at = ?, rev = rev + 1 where id = ?", [t, t, r.id]);
      const row = db.getFirstSync<TxRow>("select * from transactions where id = ?", [r.id]);
      if (row) enqueue("transactions", r.id, "upsert", row);
    }
    const thisMonth = yearMonthOf(todayDate);
    let month = yearMonthOf(it.startDate);
    while (month <= thisMonth) {
      const date = occurrenceDate(it, month);
      if (date && date <= todayDate) {
        const existing =
          db.getFirstSync<{ n: number }>(
            "select count(*) as n from transactions where recurring_id = ? and source = 'recurring' and local_date >= ? and local_date <= ?",
            [id, `${month}-01`, `${month}-31`],
          )?.n ?? 0;
        if (existing === 0) {
          const bid = bookingId(it.id, date);
          const res = db.runSync(
            `insert or ignore into transactions
               (id, amount_cents, type, category_id, note, merchant, local_date, occurred_at, source, recurring_id, created_at, client_updated_at)
             values (?, ?, 'expense', ?, ?, null, ?, ?, 'recurring', ?, ?, ?)`,
            [bid, it.amountCents, it.categoryId, it.name, date, `${date}T06:00:00.000Z`, it.id, t, t],
          );
          if (res.changes > 0) {
            const row = db.getFirstSync<TxRow>("select * from transactions where id = ?", [bid]);
            if (row) enqueue("transactions", bid, "upsert", row);
          }
        }
      }
      const [y, m] = month.split("-").map(Number) as [number, number];
      month = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    }
  });
}

export function getRecurring(id: string): RecurringRecord | null {
  const r = getDb().getFirstSync<RecRow>("select * from recurring_items where id = ? and deleted_at is null", [id]);
  return r ? mapRec(r) : null;
}

/** Izmjena vrijedi od sljedećeg knjiženja; već knjiženi troškovi se ne mijenjaju. */
export function updateRecurring(
  id: string,
  input: {
    name: string;
    amountCents: Cents;
    dayOfMonth: number;
    categoryId: string | null;
    iconKey?: string | null;
    startDate?: LocalDate;
    /** null = bez kraja. */
    endDate?: LocalDate | null;
  },
): void {
  const db = getDb();
  const t = nowIso();
  const cur = getRecurring(id);
  const start = input.startDate ?? cur?.startDate ?? `${yearMonthOf(today())}-01`;
  const end = input.endDate === undefined ? cur?.endDate ?? null : input.endDate;
  db.withTransactionSync(() => {
    db.runSync(
      `update recurring_items set name = ?, amount_cents = ?, day_of_month = ?, category_id = ?, icon_key = ?,
         start_date = ?, end_date = ?, client_updated_at = ?, rev = rev + 1 where id = ?`,
      [
        input.name.trim(), Math.round(input.amountCents), Math.min(31, Math.max(1, Math.round(input.dayOfMonth))),
        input.categoryId, input.iconKey ?? null, start, end, t, id,
      ],
    );
    const r = db.getFirstSync<RecRow>("select * from recurring_items where id = ?", [id]);
    if (r) enqueue("recurring_items", id, "upsert", r);
  });
  reconcileBookings(id);
  notifyDbChanged();
}

export function deleteRecurring(id: string): void {
  const db = getDb();
  const t = nowIso();
  db.withTransactionSync(() => {
    db.runSync("update recurring_items set deleted_at = ?, client_updated_at = ?, rev = rev + 1 where id = ?", [t, t, id]);
    enqueue("recurring_items", id, "delete", { id, deleted_at: t, client_updated_at: t });
  });
  notifyDbChanged();
}

/**
 * Knjiži dospjele pretplate za mjesec od `fromMonth` do mjeseca današnjeg dana.
 * Idempotentno: ID knjiženja je deterministički (stavka + dan), pa se ništa ne udvostruči,
 * ni na ovom uređaju ni nakon sinkronizacije s drugog.
 */
export function bookDueRecurring(todayDate: LocalDate = today()): number {
  const db = getDb();
  const items = listRecurring();
  if (items.length === 0) return 0;

  const lastKey = "recurring.lastBookedMonth";
  const thisMonth = yearMonthOf(todayDate);
  let month = kvGet(lastKey) ?? thisMonth;
  if (month > thisMonth) month = thisMonth;

  let booked = 0;
  const t = nowIso();
  db.withTransactionSync(() => {
    for (;;) {
      for (const it of items) {
        const date = occurrenceDate(it, month);
        if (!date || date > todayDate) continue;
        const id = bookingId(it.id, date);
        const res = db.runSync(
          `insert or ignore into transactions
             (id, amount_cents, type, category_id, note, merchant, local_date, occurred_at, source, recurring_id, created_at, client_updated_at)
           values (?, ?, 'expense', ?, ?, null, ?, ?, 'recurring', ?, ?, ?)`,
          [id, it.amountCents, it.categoryId, it.name, date, `${date}T06:00:00.000Z`, it.id, t, t],
        );
        if (res.changes > 0) {
          booked += 1;
          enqueue("transactions", id, "upsert", {
            id, amount_cents: it.amountCents, type: "expense", category_id: it.categoryId, note: it.name,
            local_date: date, occurred_at: `${date}T06:00:00.000Z`, source: "recurring", recurring_id: it.id, client_updated_at: t,
          });
        }
      }
      if (month >= thisMonth) break;
      const [y, m] = month.split("-").map(Number) as [number, number];
      month = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    }
    db.runSync(
      "insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
      [lastKey, thisMonth],
    );
  });
  if (booked > 0) notifyDbChanged();
  return booked;
}

/* ---------- izračun za početni ekran ---------- */

export function getMonthSummary(todayDate: LocalDate = today()): { limit: LimitResult; plan: MonthPlan | null } {
  const month = yearMonthOf(todayDate);
  const plan = getPlan(month) ?? getLatestPlanBefore(month);
  const recurring = listRecurring();
  const txs: TxLike[] = listTransactionsInMonth(month).map((t) => ({
    amountCents: t.amountCents, type: t.type, source: t.source, localDate: t.localDate,
  }));
  const limit = summarizeMonth({
    plan: { incomeCents: plan?.incomeCents ?? 0, savingsCents: plan?.savingsCents ?? 0 },
    recurring,
    transactions: txs,
    today: todayDate,
  });
  return { limit, plan };
}

export { previousMonth };

/** Najraniji mjesec koji ima ijedan trošak (za granicu kretanja po mjesecima); null ako nema troškova. */
export function earliestTxMonth(): YearMonth | null {
  const r = getDb().getFirstSync<{ d: string | null }>("select min(local_date) as d from transactions where deleted_at is null");
  return r?.d ? r.d.slice(0, 7) : null;
}

/* ---------- štednja ---------- */

export interface SavingsEntry {
  month: YearMonth;
  plannedCents: Cents;
  /** null = još nepotvrđeno. */
  actualCents: Cents | null;
}

type SavingsRow = { month: string; planned_cents: number; actual_cents: number | null };
const mapSavings = (r: SavingsRow): SavingsEntry => ({ month: r.month, plannedCents: r.planned_cents, actualCents: r.actual_cents });

export function getSavings(month: YearMonth): SavingsEntry | null {
  const r = getDb().getFirstSync<SavingsRow>("select month, planned_cents, actual_cents from savings_entries where month = ? and deleted_at is null", [month]);
  return r ? mapSavings(r) : null;
}

export function listSavings(): SavingsEntry[] {
  return getDb()
    .getAllSync<SavingsRow>("select month, planned_cents, actual_cents from savings_entries where deleted_at is null order by month desc")
    .map(mapSavings);
}

/** Mjeseci u kojima je štednja bila planirana (iz plana), da se prošli nepotvrđeni mjeseci mogu naknadno potvrditi. */
export function listPlannedSavings(): { month: YearMonth; plannedCents: Cents }[] {
  return getDb()
    .getAllSync<{ month: string; savings_cents: number }>("select month, savings_cents from month_plans where deleted_at is null and savings_cents > 0 order by month desc")
    .map((r) => ({ month: r.month, plannedCents: r.savings_cents }));
}

/** Potvrda štednje za mjesec (stvara ili mijenja). `plannedCents` se pri prvom upisu uzima iz plana tog mjeseca. */
export function setSavings(month: YearMonth, actualCents: Cents | null, plannedCents?: Cents): void {
  const db = getDb();
  const id = uuidV5(`saving:${month}`, PLAN_NAMESPACE);
  const t = nowIso();
  const planned = plannedCents ?? getPlan(month)?.savingsCents ?? getSavings(month)?.plannedCents ?? 0;
  db.withTransactionSync(() => {
    db.runSync(
      `insert into savings_entries (id, month, planned_cents, actual_cents, created_at, client_updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict(month) do update set planned_cents = excluded.planned_cents, actual_cents = excluded.actual_cents,
         client_updated_at = excluded.client_updated_at, rev = rev + 1, deleted_at = null`,
      [id, month, planned, actualCents, t, t],
    );
    const r = db.getFirstSync<Record<string, unknown>>("select * from savings_entries where month = ?", [month]);
    if (r) enqueue("savings_entries", id, "upsert", r);
  });
  notifyDbChanged();
}

export interface SavingsStats {
  totalCents: Cents;
  /** Broj mjeseci u kojima je štednja potvrđena. */
  confirmedMonths: number;
  /** Uzastopni mjeseci (do zadnjeg potvrđenog) u kojima je ušteđeno barem planirano. */
  streak: number;
  /** Koliko mjeseci koristiš aplikaciju (od prvog plana ili troška). */
  monthsUsing: number;
}

export function savingsStats(todayDate: LocalDate = today()): SavingsStats {
  const entries = listSavings().filter((e) => e.actualCents !== null);
  const totalCents = entries.reduce((s, e) => s + (e.actualCents ?? 0), 0);
  const thisMonth = yearMonthOf(todayDate);
  // Niz: od tekućeg (ako je potvrđen) ili prošlog mjeseca unatrag dok je ostvareno ≥ planirano.
  const byMonth = new Map(entries.map((e) => [e.month, e]));
  let streak = 0;
  let m: YearMonth = byMonth.has(thisMonth) ? thisMonth : previousMonth(thisMonth);
  for (;;) {
    const e = byMonth.get(m);
    if (!e || e.plannedCents <= 0 || (e.actualCents ?? 0) < e.plannedCents) break;
    streak += 1;
    m = previousMonth(m);
  }
  const first = getDb().getFirstSync<{ m: string | null }>(
    "select min(m) as m from (select min(month) as m from month_plans where deleted_at is null union all select min(substr(local_date,1,7)) from transactions where deleted_at is null)",
  )?.m;
  const [fy, fm] = (first ?? thisMonth).split("-").map(Number) as [number, number];
  const [ty, tm] = thisMonth.split("-").map(Number) as [number, number];
  return { totalCents, confirmedMonths: entries.length, streak, monthsUsing: Math.max(1, (ty - fy) * 12 + (tm - fm) + 1) };
}
