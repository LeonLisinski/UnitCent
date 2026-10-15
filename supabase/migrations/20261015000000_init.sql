-- UnitCent: početna shema (Faza 0). NIJE još izvršena nad bazom; pregledati i primijeniti na dev projekt.
-- Pravila: docs/APP-PLAN.md §4.3. Iznosi su cijeli brojevi u centima. Svaka tablica ima RLS po user_id.

create extension if not exists pgcrypto;

-- ---------- pomoćno ----------
-- updated_at postavlja poslužitelj (služi samo kao kursor za sync, ne za rješavanje sukoba).
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profili ----------
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  locale         text not null default 'hr',
  currency       text not null default 'EUR',
  timezone       text not null default 'Europe/Zagreb',
  onboarded_at   timestamptz,
  plan_defaults  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- kategorije ----------
create table if not exists public.categories (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  icon               text not null,
  color_token        text not null,
  sort               integer not null default 0,
  is_system          boolean not null default false,
  archived           boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);

-- ---------- ponavljajuće stavke (pretplate, fiksni troškovi) ----------
create table if not exists public.recurring_items (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  amount_cents       integer not null check (amount_cents >= 0),
  day_of_month       smallint not null check (day_of_month between 1 and 31),
  category_id        uuid references public.categories(id),
  active             boolean not null default true,
  start_date         date not null,
  end_date           date,
  icon_key           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);

-- ---------- računi i stavke računa ----------
create table if not exists public.receipts (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  merchant           text,
  total_cents        integer not null check (total_cents >= 0),
  issued_at          timestamptz,
  fiscal_ref         text,                      -- JIR, za deduplikaciju
  status             text not null default 'pending' check (status in ('pending','ok','review','failed')),
  image_path         text,                      -- {user_id}/..., briše se nakon obrade
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);
create unique index if not exists receipts_user_fiscal_ref_key
  on public.receipts (user_id, fiscal_ref) where fiscal_ref is not null and deleted_at is null;

create table if not exists public.receipt_items (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  receipt_id         uuid not null references public.receipts(id) on delete cascade,
  raw_name           text not null,
  name               text not null,
  amount_cents       integer not null,           -- popusti i povrat su negativni
  category_id        uuid references public.categories(id),
  confidence         real,
  line_type          text not null default 'item' check (line_type in ('item','discount','deposit')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);

-- ---------- transakcije ----------
create table if not exists public.transactions (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  amount_cents       integer not null check (amount_cents >= 0),
  type               text not null check (type in ('expense','income')),
  category_id        uuid references public.categories(id),
  note               text,
  merchant           text,
  local_date         date not null,
  occurred_at        timestamptz not null,
  source             text not null default 'manual' check (source in ('manual','scan','recurring')),
  receipt_id         uuid references public.receipts(id),
  recurring_id       uuid references public.recurring_items(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, local_date desc);
create index if not exists transactions_user_cat_date_idx on public.transactions (user_id, category_id, local_date);

-- ---------- plan mjeseca i budžeti ----------
create table if not exists public.month_plans (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  month              text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  income_cents       integer not null default 0 check (income_cents >= 0),
  savings_cents      integer not null default 0 check (savings_cents >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0,
  unique (user_id, month)
);

create table if not exists public.budgets (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  category_id        uuid not null references public.categories(id),
  month              text,
  limit_cents        integer not null check (limit_cents >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0
);

-- ---------- učenje iz ispravaka ----------
create table if not exists public.merchant_rules (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  pattern            text not null,
  category_id        uuid not null references public.categories(id),
  hits               integer not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0,
  unique (user_id, pattern)
);

-- ---------- pristup (piše samo poslužitelj) ----------
create table if not exists public.entitlements (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  premium_until  timestamptz,
  source         text,
  product        text check (product in ('yearly','monthly','lifetime')),
  rc_customer_id text,
  last_event_at  timestamptz,
  updated_at     timestamptz not null default now()
);

create table if not exists public.scan_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  month    text not null,
  count    integer not null default 0,
  primary key (user_id, month)
);

-- ---------- okidači updated_at + sync indeksi ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','recurring_items','receipts','receipt_items',
                           'transactions','month_plans','budgets','merchant_rules','entitlements']
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before insert or update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
  foreach t in array array['categories','recurring_items','receipts','receipt_items',
                           'transactions','month_plans','budgets','merchant_rules']
  loop
    execute format('create index if not exists %I_sync_idx on public.%I (user_id, updated_at, id)', t, t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.recurring_items enable row level security;
alter table public.receipts        enable row level security;
alter table public.receipt_items   enable row level security;
alter table public.transactions    enable row level security;
alter table public.month_plans     enable row level security;
alter table public.budgets         enable row level security;
alter table public.merchant_rules  enable row level security;
alter table public.entitlements    enable row level security;
alter table public.scan_usage      enable row level security;

-- Korisnik vidi i mijenja samo svoje retke.
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','recurring_items','receipts','receipt_items',
                           'transactions','month_plans','budgets','merchant_rules']
  loop
    execute format('drop policy if exists %I_own on public.%I', t, t);
    execute format('create policy %I_own on public.%I for all to authenticated
                    using (user_id = (select auth.uid()))
                    with check (user_id = (select auth.uid()))', t, t);
  end loop;
end $$;

-- entitlements i scan_usage: klijent samo čita; piše isključivo service_role (webhook, Edge Functions).
drop policy if exists entitlements_read_own on public.entitlements;
create policy entitlements_read_own on public.entitlements for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists scan_usage_read_own on public.scan_usage;
create policy scan_usage_read_own on public.scan_usage for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Storage: privatni bucket za slike računa ----------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists receipts_own_objects on storage.objects;
create policy receipts_own_objects on storage.objects for all to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
