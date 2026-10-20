-- UnitCent: e-mailovi (faza F, docs/PLAN-DORADE.md). Pružatelj je Brevo; sve slanje ide preko Edge Functiona.
-- email_prefs: izbor korisnika. `product` = sažeci i savjeti (dobrodošlica, tjedni i mjesečni sažetak, povratak),
--   uključeno dok se korisnik ne odjavi. `newsletter` je zaseban, neoznačen izbor (GDPR): uključuje ga samo korisnik.
--   `token` služi odjavi jednim klikom iz maila (bez prijave). Piše samo poslužitelj (email-prefs, email-send).
-- email_log: jedan redak po korisniku, vrsti i razdoblju. Služi idempotenciji (isti mail nikad dvaput) i adminu.

create table if not exists public.email_prefs (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  product               boolean not null default true,
  newsletter            boolean not null default false,
  newsletter_consent_at timestamptz,
  newsletter_off_at     timestamptz,
  product_off_at        timestamptz,
  token                 uuid not null default gen_random_uuid() unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
drop trigger if exists email_prefs_set_updated_at on public.email_prefs;
create trigger email_prefs_set_updated_at before insert or update on public.email_prefs
  for each row execute function public.set_updated_at();

alter table public.email_prefs enable row level security;
drop policy if exists email_prefs_read_own on public.email_prefs;
create policy email_prefs_read_own on public.email_prefs for select to authenticated
  using (user_id = (select auth.uid()));
-- Nema politike za pisanje: izmjene idu preko funkcije email-prefs (usklađuje i Brevo popis).

create table if not exists public.email_log (
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('welcome', 'tips', 'weekly', 'monthly', 'winback')),
  period      text not null default '',          -- '' jednokratno, '2026-W43' tjedno, '2026-10' mjesečno
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  message_id  text,
  premium_cta boolean not null default false,     -- mail je spomenuo Premium (najviše svaki 3. do 4.)
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, period)
);
create index if not exists email_log_kind_created_idx on public.email_log (kind, created_at desc);
alter table public.email_log enable row level security; -- samo service_role

-- Kandidati za jednu vrstu maila: korisnici s e-adresom (ne gosti), s uključenim `product` (ili bez retka u
-- email_prefs, zadano je uključeno), kojima taj mail za to razdoblje još nije zabilježen.
-- Pravila vremena (dobrodošlica, 3. dan, povratak) su ovdje da kandidati budu mali i jeftini za dohvat.
create or replace function public.email_candidates(p_kind text, p_period text, p_limit integer)
returns table (user_id uuid, email text, name text, premium boolean, weekly_sent integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind not in ('welcome', 'tips', 'weekly', 'monthly', 'winback') then
    raise exception 'bad kind: %', p_kind using errcode = '22023';
  end if;
  return query
  select u.id,
         u.email::text,
         coalesce(u.raw_user_meta_data ->> 'given_name', split_part(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), ' ', 1)),
         coalesce(e.premium_until > now(), false),
         (select count(*)::integer from public.email_log l where l.user_id = u.id and l.kind = 'weekly' and l.status = 'sent')
    from auth.users u
    left join public.email_prefs p on p.user_id = u.id
    left join public.entitlements e on e.user_id = u.id
   where not coalesce(u.is_anonymous, false)
     and u.email is not null and u.email <> ''
     and u.deleted_at is null
     and coalesce(p.product, true)
     and not exists (select 1 from public.email_log l where l.user_id = u.id and l.kind = p_kind and l.period = p_period)
     and case p_kind
       -- dobrodošlica: račun s e-adresom povezan u zadnjih 7 dana (gost koji se prijavio dobiva je tek tada)
       when 'welcome' then exists (select 1 from auth.identities i where i.user_id = u.id and i.provider <> 'anonymous'
                                    and i.created_at > now() - interval '7 days')
       -- 3. dan: dobrodošlica poslana prije 3 do 10 dana
       when 'tips' then exists (select 1 from public.email_log w where w.user_id = u.id and w.kind = 'welcome' and w.status = 'sent'
                                 and w.created_at between now() - interval '10 days' and now() - interval '3 days')
       -- povratak: zadnji unos prije 10 do 30 dana, jednom zauvijek (period '')
       when 'winback' then (select max(t.created_at) from public.transactions t where t.user_id = u.id and t.source <> 'recurring')
                             between now() - interval '30 days' and now() - interval '10 days'
       -- tjedni i mjesečni: račun stariji od 6 dana (prvi tjedan ide dobrodošlica i savjet)
       else u.created_at < now() - interval '6 days'
     end
   order by u.created_at
   limit greatest(1, least(p_limit, 500));
end $$;

revoke all on function public.email_candidates(text, text, integer) from public, anon, authenticated;
grant execute on function public.email_candidates(text, text, integer) to service_role;

-- Brevo webhook (odjava, neželjena pošta) zna samo adresu; ovo je jedini put od adrese do korisnika.
create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) and not coalesce(is_anonymous, false) limit 1;
$$;
revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;

-- ---------- raspored (pg_cron + pg_net) ----------
-- Poziva Edge Function email-send s tajnom (x-cron-secret). URL projekta i tajna su u Vaultu, ne u migraciji:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<ista vrijednost kao EMAIL_CRON_SECRET u Edge Function Secrets>', 'email_cron_secret');
-- Vrijeme je UTC (Zagreb je UTC+1 zimi, UTC+2 ljeti). Brevo besplatno: 300 mailova dnevno, pa poziv šalje najviše 100.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions; -- funkcije su u shemi net

create or replace function public.email_cron_call(p_job text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1);
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret' limit 1);
begin
  if base is null or secret is null then
    return; -- raspored nije podešen (npr. lokalno)
  end if;
  perform net.http_post(
    url := base || '/functions/v1/email-send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := jsonb_build_object('job', p_job),
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.email_cron_call(text) from public, anon, authenticated;

do $$
begin
  perform cron.unschedule(jobname) from cron.job where jobname like 'email-%';
  -- dobrodošlica i savjet 3. dana: svakih 30 minuta, 7 do 21 h
  perform cron.schedule('email-welcome', '5,35 5-19 * * *', $c$select public.email_cron_call('welcome')$c$);
  perform cron.schedule('email-tips', '15 7 * * *', $c$select public.email_cron_call('tips')$c$);
  -- tjedni sažetak: ponedjeljak ujutro, više krugova dok se svi ne pošalju
  perform cron.schedule('email-weekly', '0,20,40 6-9 * * 1', $c$select public.email_cron_call('weekly')$c$);
  -- mjesečni pregled: 1. u mjesecu ujutro
  perform cron.schedule('email-monthly', '0,20,40 7-10 1 * *', $c$select public.email_cron_call('monthly')$c$);
  -- povratak nakon 10 dana neaktivnosti: svaki dan poslijepodne
  perform cron.schedule('email-winback', '30 15 * * *', $c$select public.email_cron_call('winback')$c$);
end $$;
