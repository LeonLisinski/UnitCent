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
];
