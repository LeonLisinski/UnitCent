-- UnitCent: jedno skeniranje = jedna sesija (scan_id s klijenta). Aplikacija počne čitati odmah nakon snimke, a ako
-- korisnik doda još dio dugog računa, čita ponovno sa svim dijelovima. Kvota se broji jednom po sesiji.
-- Zaštita od zlouporabe: sesija vrijedi 15 minuta i najviše 6 poziva; nakon toga se broji kao novo skeniranje.

create table if not exists public.scan_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid not null,
  month text not null,
  charged boolean not null default false,
  calls integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, scan_id)
);
alter table public.scan_sessions enable row level security; -- samo service_role (Edge Function)

-- Vraća broj iskorištenih skeniranja u mjesecu (kao consume_scan) ili NULL kad je granica dosegnuta.
create or replace function public.consume_scan_session(p_user uuid, p_month text, p_limit integer, p_scan uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare s public.scan_sessions; c integer;
begin
  insert into public.scan_sessions (user_id, scan_id, month) values (p_user, p_scan, p_month)
    on conflict (user_id, scan_id) do nothing;
  select * into s from public.scan_sessions where user_id = p_user and scan_id = p_scan for update;
  if s.charged and s.calls < 6 and s.created_at > now() - interval '15 minutes' and s.month = p_month then
    update public.scan_sessions set calls = calls + 1 where user_id = p_user and scan_id = p_scan;
    select count into c from public.scan_usage where user_id = p_user and month = p_month;
    return c;
  end if;
  c := public.consume_scan(p_user, p_month, p_limit);
  if c is not null then
    update public.scan_sessions set charged = true, calls = 1, created_at = now(), month = p_month
     where user_id = p_user and scan_id = p_scan;
  end if;
  return c;
end $$;

-- Neuspjeh ili nečitljiv račun: vraća skeniranje samo ako je sesija naplaćena, i označi je nenaplaćenom.
create or replace function public.refund_scan_session(p_user uuid, p_month text, p_scan uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.scan_sessions set charged = false where user_id = p_user and scan_id = p_scan and charged;
  if found then perform public.refund_scan(p_user, p_month); end if;
end $$;

revoke all on function public.consume_scan_session(uuid, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.refund_scan_session(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.consume_scan_session(uuid, text, integer, uuid) to service_role;
grant execute on function public.refund_scan_session(uuid, text, uuid) to service_role;
