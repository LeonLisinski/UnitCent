-- UnitCent: admin pregled (faza G). Jedna funkcija vraća zbrojeve za aplikaciju apps/admin.
-- Bez osobnih podataka: samo brojevi. Poziva je samo Edge Function admin-stats (service_role) nakon provjere vlasnika.
-- „Aktivan“ = upisao barem jedan trošak ili prihod (ne knjiženu pretplatu) u razdoblju.

create index if not exists transactions_created_idx on public.transactions (created_at) where source <> 'recurring';

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(now() at time zone 'Europe/Zagreb', 'YYYY-MM');
  v_prev  text := to_char((now() at time zone 'Europe/Zagreb') - interval '1 month', 'YYYY-MM');
  v_out jsonb;
begin
  with
  u as (select id, created_at, coalesce(is_anonymous, false) as anon, email from auth.users where deleted_at is null),
  act as (select user_id, max(created_at) as last_at from public.transactions where source <> 'recurring' and created_at > now() - interval '30 days' group by user_id),
  c7 as (select id from u where created_at between now() - interval '14 days' and now() - interval '7 days'),
  c30 as (select id from u where created_at between now() - interval '60 days' and now() - interval '30 days')
  select jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from u),
      'with_email', (select count(*) from u where not anon and email is not null),
      'new_1d', (select count(*) from u where created_at > now() - interval '1 day'),
      'new_7d', (select count(*) from u where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from u where created_at > now() - interval '30 days'),
      'dau', (select count(*) from act where last_at > now() - interval '1 day'),
      'wau', (select count(*) from act where last_at > now() - interval '7 days'),
      'mau', (select count(*) from act),
      -- zadržavanje: od korisnika stvorenih prije 7 do 14 (odnosno 30 do 60) dana, koliko ih je aktivno zadnjih 7 dana
      'retention_d7', jsonb_build_object('cohort', (select count(*) from c7),
        'active', (select count(*) from c7 join act on act.user_id = c7.id where act.last_at > now() - interval '7 days')),
      'retention_d30', jsonb_build_object('cohort', (select count(*) from c30),
        'active', (select count(*) from c30 join act on act.user_id = c30.id where act.last_at > now() - interval '7 days')),
      'new_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', n) order by d), '[]'::jsonb) from (
          select g.d, (select count(*) from u where (u.created_at at time zone 'Europe/Zagreb')::date = g.d::date) as n
            from generate_series((now() at time zone 'Europe/Zagreb')::date - 13, (now() at time zone 'Europe/Zagreb')::date, interval '1 day') as g(d)
        ) s)
    ),
    'premium', jsonb_build_object(
      'active', (select count(*) from public.entitlements where premium_until > now()),
      'yearly', (select count(*) from public.entitlements where premium_until > now() and product = 'yearly'),
      'monthly', (select count(*) from public.entitlements where premium_until > now() and product = 'monthly'),
      'expiring_7d', (select count(*) from public.entitlements where premium_until between now() and now() + interval '7 days')
    ),
    'ai', jsonb_build_object(
      'month', v_month,
      'scans', (select coalesce(sum(count), 0) from public.scan_usage where scan_usage.month = v_month),
      'scans_prev', (select coalesce(sum(count), 0) from public.scan_usage where scan_usage.month = v_prev),
      'scan_users', (select count(*) from public.scan_usage where scan_usage.month = v_month and count > 0),
      'advisor', (select coalesce(sum(count), 0) from public.advisor_usage where to_char(day, 'YYYY-MM') = v_month)
    ),
    'email', jsonb_build_object(
      'audience', (select count(*) from u left join public.email_prefs p on p.user_id = u.id where not u.anon and u.email is not null and coalesce(p.product, true)),
      'newsletter', (select count(*) from public.email_prefs where newsletter),
      'newsletter_off_30d', (select count(*) from public.email_prefs where not newsletter and newsletter_off_at > now() - interval '30 days'),
      'product_off_30d', (select count(*) from public.email_prefs where not product and product_off_at > now() - interval '30 days'),
      'last_7d', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
          select kind, count(*) as n from public.email_log where status = 'sent' and created_at > now() - interval '7 days' group by kind) s),
      'failed_7d', (select count(*) from public.email_log where status = 'failed' and created_at > now() - interval '7 days')
    ),
    'generated_at', now()
  ) into v_out;
  return v_out;
end $$;

revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
