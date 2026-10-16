-- UnitCent: Faza 2 (sinkronizacija). Pravila: docs/APP-PLAN.md §4.4.
-- 1) Složeni ključ (user_id, id): determinističke ID-eve (zadane kategorije, plan mjeseca) generira
--    svaki uređaj sam, pa ID smije biti jedinstven samo unutar korisnika, a ne globalno.
-- 2) sync_push: idempotentan upis skupine redaka uz pravilo "zadnja izmjena pobjeđuje".
-- 3) Učvršćenje prema savjetnicima: search_path funkcije i indeksi na stranim ključevima.

-- ---------- učvršćenje ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- složeni primarni i strani ključevi ----------
alter table public.recurring_items drop constraint if exists recurring_items_category_id_fkey;
alter table public.receipt_items   drop constraint if exists receipt_items_receipt_id_fkey;
alter table public.receipt_items   drop constraint if exists receipt_items_category_id_fkey;
alter table public.transactions    drop constraint if exists transactions_category_id_fkey;
alter table public.transactions    drop constraint if exists transactions_receipt_id_fkey;
alter table public.transactions    drop constraint if exists transactions_recurring_id_fkey;
alter table public.budgets         drop constraint if exists budgets_category_id_fkey;
alter table public.merchant_rules  drop constraint if exists merchant_rules_category_id_fkey;

do $$
declare t text;
begin
  foreach t in array array['categories','recurring_items','receipts','receipt_items',
                           'transactions','month_plans','budgets','merchant_rules']
  loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_pkey');
    execute format('alter table public.%I add constraint %I primary key (user_id, id)', t, t || '_pkey');
  end loop;
end $$;

alter table public.recurring_items add constraint recurring_items_category_fk
  foreign key (user_id, category_id) references public.categories (user_id, id);
alter table public.receipt_items add constraint receipt_items_receipt_fk
  foreign key (user_id, receipt_id) references public.receipts (user_id, id) on delete cascade;
alter table public.receipt_items add constraint receipt_items_category_fk
  foreign key (user_id, category_id) references public.categories (user_id, id);
alter table public.transactions add constraint transactions_category_fk
  foreign key (user_id, category_id) references public.categories (user_id, id);
alter table public.transactions add constraint transactions_receipt_fk
  foreign key (user_id, receipt_id) references public.receipts (user_id, id);
alter table public.transactions add constraint transactions_recurring_fk
  foreign key (user_id, recurring_id) references public.recurring_items (user_id, id);
alter table public.budgets add constraint budgets_category_fk
  foreign key (user_id, category_id) references public.categories (user_id, id);
alter table public.merchant_rules add constraint merchant_rules_category_fk
  foreign key (user_id, category_id) references public.categories (user_id, id);

-- indeksi za strane ključeve (user_id je prvi stupac većine postojećih indeksa)
create index if not exists recurring_items_category_idx on public.recurring_items (user_id, category_id);
create index if not exists receipt_items_receipt_idx    on public.receipt_items (user_id, receipt_id);
create index if not exists receipt_items_category_idx   on public.receipt_items (user_id, category_id);
create index if not exists transactions_receipt_idx     on public.transactions (user_id, receipt_id);
create index if not exists transactions_recurring_idx   on public.transactions (user_id, recurring_id);
create index if not exists budgets_category_idx         on public.budgets (user_id, category_id);
create index if not exists merchant_rules_category_idx  on public.merchant_rules (user_id, category_id);

-- ---------- sync_push ----------
-- p_op = 'upsert': p_rows su potpuni retci (snake_case); nepoznati ključevi se ignoriraju.
-- p_op = 'delete': p_rows su {id, client_updated_at, rev}; meko brisanje (deleted_at).
-- user_id se uvijek postavlja na auth.uid() (klijentova vrijednost se ignorira). SECURITY INVOKER: RLS vrijedi.
-- Vraća broj stvarno zapisanih redaka (stariji retci od postojećih se preskaču bez greške).
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
                     'transactions','month_plans','budgets','merchant_rules') then
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

  select string_agg(format('%I', column_name), ', ' order by ordinal_position),
         string_agg(
           case column_name
             when 'user_id'           then '$2'
             when 'created_at'        then 'coalesce(r.created_at, now())'
             when 'client_updated_at' then 'least(coalesce(r.client_updated_at, now()), now() + interval ''5 minutes'')'
             when 'rev'               then 'coalesce(r.rev, 0)'
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
