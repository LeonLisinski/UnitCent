/**
 * Lokalna SQLite shema (izvor istine za UI). Zrcali poslužiteljske tablice iz supabase/migrations,
 * bez `user_id` (uređaj ima jednog korisnika; `user_id` se dodaje pri sinkronizaciji).
 * Migracije su numerirane; `PRAGMA user_version` pamti zadnju primijenjenu.
 */
export interface Migration {
  version: number;
  sql: string;
}

const SYNC_COLS = `
  created_at text not null,
  updated_at text,
  client_updated_at text not null,
  deleted_at text,
  rev integer not null default 0`;

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
create table categories (
  id text primary key,
  key text unique,
  name text not null,
  icon text not null,
  color_token text not null,
  sort integer not null default 0,
  is_system integer not null default 0,
  archived integer not null default 0,
  ${SYNC_COLS}
);

create table transactions (
  id text primary key,
  amount_cents integer not null check (amount_cents >= 0),
  type text not null check (type in ('expense','income')),
  category_id text references categories(id),
  note text,
  merchant text,
  local_date text not null,
  occurred_at text not null,
  source text not null default 'manual' check (source in ('manual','scan','recurring')),
  receipt_id text,
  recurring_id text,
  ${SYNC_COLS}
);
create index transactions_date_idx on transactions (local_date desc) where deleted_at is null;
create index transactions_cat_date_idx on transactions (category_id, local_date) where deleted_at is null;

create table recurring_items (
  id text primary key,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  day_of_month integer not null check (day_of_month between 1 and 31),
  category_id text references categories(id),
  active integer not null default 1,
  start_date text not null,
  end_date text,
  icon_key text,
  ${SYNC_COLS}
);

create table month_plans (
  id text primary key,
  month text not null unique,
  income_cents integer not null default 0,
  savings_cents integer not null default 0,
  ${SYNC_COLS}
);

create table kv (
  key text primary key,
  value text not null
);

-- Red za sinkronizaciju (Faza 2 ga šalje). Piše se u istoj transakciji kao i podatak.
create table outbox (
  seq integer primary key autoincrement,
  table_name text not null,
  row_id text not null,
  op text not null check (op in ('upsert','delete')),
  payload text not null,
  created_at text not null,
  attempts integer not null default 0
);
`,
  },
  {
    version: 2,
    sql: `
-- Praćenje štednje: jedan redak po mjesecu (planirano iz plana, ostvareno potvrđuje korisnik).
create table savings_entries (
  id text primary key,
  month text not null unique,
  planned_cents integer not null default 0,
  actual_cents integer,
  ${SYNC_COLS}
);
`,
  },
  {
    version: 3,
    sql: `
-- Budžeti po kategoriji (Premium): mjesečni limit; month = null znači „svaki mjesec“.
create table budgets (
  id text primary key,
  category_id text not null references categories(id),
  month text,
  limit_cents integer not null check (limit_cents >= 0),
  ${SYNC_COLS}
);
create unique index budgets_category_idx on budgets (category_id) where deleted_at is null and month is null;
`,
  },
  {
    version: 4,
    sql: `
-- Vrsta kategorije: trošak ili prihod.
alter table categories add column kind text not null default 'expense' check (kind in ('expense','income'));
`,
  },
  {
    version: 5,
    sql: `
-- Pročitani računi i njihove stavke (slika se ne sprema; stavke ostaju za uvid i ispravke).
create table receipts (
  id text primary key,
  merchant text,
  total_cents integer not null check (total_cents >= 0),
  issued_at text,
  fiscal_ref text,
  status text not null default 'ok' check (status in ('pending','ok','review','failed')),
  ${SYNC_COLS}
);
create table receipt_items (
  id text primary key,
  receipt_id text not null references receipts(id),
  raw_name text not null,
  name text not null,
  amount_cents integer not null,
  category_id text references categories(id),
  confidence real,
  line_type text not null default 'item' check (line_type in ('item','discount','deposit')),
  ${SYNC_COLS}
);
create index receipt_items_receipt_idx on receipt_items (receipt_id) where deleted_at is null;
`,
  },
  {
    version: 6,
    sql: `
-- D-13: potrošeno prije početka praćenja (u mjesecu plana) i stanje štednje na početku mjeseca.
alter table month_plans add column spent_before_cents integer not null default 0;
alter table savings_entries add column opening_cents integer;
`,
  },
];
