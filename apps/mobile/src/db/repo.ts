import * as Crypto from "expo-crypto";
import {
  DEFAULT_CATEGORIES,
  bookingId,
  occurrenceDate,
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
    merchant: null as string | null,
    local_date: input.localDate ?? today(),
    occurred_at: t,
    source: "manual" as const,
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

export function listRecentTransactions(limit = 8): Transaction[] {
  return getDb()
    .getAllSync<TxRow>(
      "select * from transactions where deleted_at is null order by local_date desc, occurred_at desc limit ?",
      [limit],
    )
    .map(mapTx);
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
}): RecurringRecord {
  const db = getDb();
  const id = newId();
  const t = nowIso();
  const row = {
    id, name: input.name.trim(), amount_cents: Math.round(input.amountCents),
    day_of_month: Math.min(31, Math.max(1, Math.round(input.dayOfMonth))),
    category_id: input.categoryId, active: 1,
    // Zadano od 1. u mjesecu: stavka s već prošlim danom odmah se knjiži i ulazi u „obavezno”.
    start_date: input.startDate ?? `${yearMonthOf(today())}-01`, end_date: null as string | null,
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
  notifyDbChanged();
  return mapRec(row);
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
