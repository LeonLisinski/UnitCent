-- AI savjetnik.
-- advisor_answers: zadnji odgovor po korisniku, mjesecu i pitanju (ponovljeno isto pitanje s istim brojkama ne troši kvotu).
-- advisor_usage: brojač pitanja po danu. Kvotu provodi samo poslužitelj (consume_advisor), klijent nema pristup.
--   Besplatno: 3 pitanja mjesečno. Premium: 20 dnevno i najviše 300 mjesečno (trošak modela ostaje ispod ~0,15 € mjesečno).
create table if not exists public.advisor_answers (
  user_id     uuid not null references auth.users(id) on delete cascade,
  month       text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  question    text not null check (question in ('where', 'save', 'subs', 'month_end')),
  facts_hash  text not null,
  text        text not null,
  rows        jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  primary key (user_id, month, question)
);
alter table public.advisor_answers enable row level security;

create table if not exists public.advisor_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  count    integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);
alter table public.advisor_usage enable row level security;
-- Nema politika: klijent ne čita ni ne piše; sve ide preko funkcije.

-- Atomarno: zaključava korisnika za trajanje transakcije, provjerava granice i povećava brojač.
-- Vraća broj iskorištenih pitanja u mjesecu nakon ovog (>= 1), -1 kad je mjesečna granica dosegnuta, -2 dnevna.
create or replace function public.consume_advisor(p_user uuid, p_day date, p_premium boolean)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_count integer;
  day_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('advisor:' || p_user::text, 0));
  select coalesce(sum(count), 0) into month_count from public.advisor_usage
   where user_id = p_user and day >= date_trunc('month', p_day)::date and day < (date_trunc('month', p_day) + interval '1 month')::date;
  select coalesce(max(count), 0) into day_count from public.advisor_usage where user_id = p_user and day = p_day;
  if not p_premium and month_count >= 3 then return -1; end if;
  if p_premium and month_count >= 300 then return -1; end if;
  if p_premium and day_count >= 20 then return -2; end if;
  insert into public.advisor_usage (user_id, day, count) values (p_user, p_day, 1)
    on conflict (user_id, day) do update set count = public.advisor_usage.count + 1;
  return month_count + 1;
end $$;

revoke all on function public.consume_advisor(uuid, date, boolean) from public, anon, authenticated;
grant execute on function public.consume_advisor(uuid, date, boolean) to service_role;
