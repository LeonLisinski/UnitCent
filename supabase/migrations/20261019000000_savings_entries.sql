-- UnitCent: praćenje štednje. Jedan redak po mjesecu: planirano (iz plana) i ostvareno (korisnik potvrđuje).
-- Sinkronizira se kao ostale tablice (composite ključ, LWW, meko brisanje).

create table if not exists public.savings_entries (
  id                 uuid not null,
  user_id            uuid not null references auth.users(id) on delete cascade,
  month              text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  planned_cents      integer not null default 0 check (planned_cents >= 0),
  actual_cents       integer check (actual_cents is null or actual_cents >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  client_updated_at  timestamptz not null default now(),
  deleted_at         timestamptz,
  rev                integer not null default 0,
  primary key (user_id, id),
  unique (user_id, month)
);

drop trigger if exists savings_entries_set_updated_at on public.savings_entries;
create trigger savings_entries_set_updated_at before insert or update on public.savings_entries
  for each row execute function public.set_updated_at();
create index if not exists savings_entries_sync_idx on public.savings_entries (user_id, updated_at, id);

alter table public.savings_entries enable row level security;
drop policy if exists savings_entries_own on public.savings_entries;
create policy savings_entries_own on public.savings_entries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- sync_push: dopuštena tablica
create or replace function public.sync_push(p_table text, p_op text, p_rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid     uuid := (select auth.uid());
  n       integer;
  cols    text;
  sel     text;
  upd     text;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_table not in ('categories','recurring_items','receipts','receipt_items',
                     'transactions','month_plans','budgets','merchant_rules','savings_entries') then
    raise exception 'table not allowed: %', p_table using errcode = '42501';
  end if;
  if p_op not in ('upsert','delete') then
    raise exception 'bad op: %', p_op using errcode = '22023';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 100 then
    raise exception 'rows must be an array of at most 100' using errcode = '22023';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    return 0;
  end if;

  if p_op = 'delete' then
    execute format($q$
      update public.%1$I t
         set deleted_at = now(),
             client_updated_at = least(r.client_updated_at, now() + interval '5 minutes'),
             rev = r.rev
        from jsonb_to_recordset($1) as r(id uuid, client_updated_at timestamptz, rev integer)
       where t.user_id = $2 and t.id = r.id
         and (least(r.client_updated_at, now() + interval '5 minutes'), r.rev) > (t.client_updated_at, t.rev)
    $q$, p_table) using p_rows, uid;
    get diagnostics n = row_count;
    return n;
  end if;

  -- Stupci koji su NOT NULL s default vrijednošću dobivaju default kad ih klijent ne pošalje.
  select string_agg(format('%I', column_name), ', ' order by ordinal_position),
         string_agg(
           case
             when column_name = 'user_id' then '$2'
             when column_name = 'client_updated_at' then 'least(coalesce(r.client_updated_at, now()), now() + interval ''5 minutes'')'
             when is_nullable = 'NO' and column_default is not null then format('coalesce(r.%I, %s)', column_name, column_default)
             else format('r.%I', column_name)
           end, ', ' order by ordinal_position),
         string_agg(format('%1$I = excluded.%1$I', column_name), ', ' order by ordinal_position)
           filter (where column_name not in ('user_id','id','created_at'))
    into cols, sel, upd
    from information_schema.columns
   where table_schema = 'public' and table_name = p_table and column_name <> 'updated_at';

  execute format($q$
    insert into public.%1$I as t (%2$s)
    select %3$s from jsonb_populate_recordset(null::public.%1$I, $1) r
    on conflict (user_id, id) do update set %4$s
    where (excluded.client_updated_at, excluded.rev) > (t.client_updated_at, t.rev)
  $q$, p_table, cols, sel, upd) using p_rows, uid;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.sync_push(text, text, jsonb) from public, anon;
grant execute on function public.sync_push(text, text, jsonb) to authenticated;
