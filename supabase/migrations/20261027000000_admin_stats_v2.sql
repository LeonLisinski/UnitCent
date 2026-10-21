-- UnitCent: admin v2 (tabovi). Uz brojeve iz v1 vraća i dnevne nizove za grafove te listu čekanja.
-- Lista čekanja smije pokazati e-adrese (samo vlasnik, preko admin-stats); ostalo su samo zbrojevi.
-- „Aktivan“ = upisao barem jedan trošak ili prihod (ne knjiženu pretplatu).

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Zagreb')::date;
  v_month text := to_char(now() at time zone 'Europe/Zagreb', 'YYYY-MM');
  v_prev  text := to_char((now() at time zone 'Europe/Zagreb') - interval '1 month', 'YYYY-MM');
  v_out jsonb;
begin
  with
  u as (select id, created_at, coalesce(is_anonymous, false) as anon, email from auth.users where deleted_at is null),
  tx as (select user_id, created_at, (created_at at time zone 'Europe/Zagreb')::date as d from public.transactions
          where source <> 'recurring' and created_at > now() - interval '35 days'),
  act as (select user_id, max(created_at) as last_at from tx where created_at > now() - interval '30 days' group by user_id),
  d30 as (select g::date as d from generate_series(v_today - 29, v_today, interval '1 day') g),
  d14 as (select d from d30 where d > v_today - 14),
  c7 as (select id from u where created_at between now() - interval '14 days' and now() - interval '7 days'),
  c30 as (select id from u where created_at between now() - interval '60 days' and now() - interval '30 days'),
  wl as (select email, source, created_at from public.waitlist)
  select jsonb_build_object(
    'waitlist', jsonb_build_object(
      'total', (select count(*) from wl),
      'new_1d', (select count(*) from wl where created_at > now() - interval '1 day'),
      'new_7d', (select count(*) from wl where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from wl where created_at > now() - interval '30 days'),
      'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d30.d, 'count',
          (select count(*) from wl where (wl.created_at at time zone 'Europe/Zagreb')::date = d30.d)) order by d30.d), '[]'::jsonb) from d30),
      'sources', (select coalesce(jsonb_agg(jsonb_build_object('source', s, 'count', n) order by n desc), '[]'::jsonb) from (
          select coalesce(nullif(source, ''), 'izravno') as s, count(*) as n from wl group by 1 order by 2 desc limit 6) x),
      'recent', (select coalesce(jsonb_agg(jsonb_build_object('email', email, 'source', source, 'at', created_at) order by created_at desc), '[]'::jsonb) from (
          select email, source, created_at from wl order by created_at desc limit 200) r)
    ),
    'users', jsonb_build_object(
      'total', (select count(*) from u),
      'with_email', (select count(*) from u where not anon and email is not null),
      'anonymous', (select count(*) from u where anon),
      'new_1d', (select count(*) from u where created_at > now() - interval '1 day'),
      'new_7d', (select count(*) from u where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from u where created_at > now() - interval '30 days'),
      'dau', (select count(*) from act where last_at > now() - interval '1 day'),
      'wau', (select count(*) from act where last_at > now() - interval '7 days'),
      'mau', (select count(*) from act),
      'entries_7d', (select count(*) from tx where created_at > now() - interval '7 days'),
      'retention_d7', jsonb_build_object('cohort', (select count(*) from c7),
        'active', (select count(*) from c7 join act on act.user_id = c7.id where act.last_at > now() - interval '7 days')),
      'retention_d30', jsonb_build_object('cohort', (select count(*) from c30),
        'active', (select count(*) from c30 join act on act.user_id = c30.id where act.last_at > now() - interval '7 days')),
      'new_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d30.d, 'count',
          (select count(*) from u where (u.created_at at time zone 'Europe/Zagreb')::date = d30.d)) order by d30.d), '[]'::jsonb) from d30),
      'active_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d14.d, 'count',
          (select count(distinct user_id) from tx where tx.d = d14.d)) order by d14.d), '[]'::jsonb) from d14)
    ),
    'premium', jsonb_build_object(
      'active', (select count(*) from public.entitlements where premium_until > now()),
      'yearly', (select count(*) from public.entitlements where premium_until > now() and product = 'yearly'),
      'monthly', (select count(*) from public.entitlements where premium_until > now() and product = 'monthly'),
      'lifetime', (select count(*) from public.entitlements where premium_until > now() and product = 'lifetime'),
      'dev', (select count(*) from public.entitlements where premium_until > now() and source = 'dev'),
      'expiring_7d', (select count(*) from public.entitlements where premium_until between now() and now() + interval '7 days'),
      'new_30d', (select count(*) from public.entitlements where premium_until > now() and updated_at > now() - interval '30 days')
    ),
    'ai', jsonb_build_object(
      'month', v_month,
      'scans', (select coalesce(sum(count), 0) from public.scan_usage where scan_usage.month = v_month),
      'scans_prev', (select coalesce(sum(count), 0) from public.scan_usage where scan_usage.month = v_prev),
      'scan_users', (select count(*) from public.scan_usage where scan_usage.month = v_month and count > 0),
      'advisor', (select coalesce(sum(count), 0) from public.advisor_usage where to_char(day, 'YYYY-MM') = v_month),
      'advisor_users', (select count(distinct user_id) from public.advisor_usage where to_char(day, 'YYYY-MM') = v_month),
      'scans_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d14.d, 'count',
          (select count(*) from public.scan_sessions s where s.charged and (s.created_at at time zone 'Europe/Zagreb')::date = d14.d)) order by d14.d), '[]'::jsonb) from d14),
      'advisor_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d14.d, 'count',
          (select coalesce(sum(a.count), 0) from public.advisor_usage a where a.day = d14.d)) order by d14.d), '[]'::jsonb) from d14)
    ),
    'email', jsonb_build_object(
      'audience', (select count(*) from u left join public.email_prefs p on p.user_id = u.id where not u.anon and u.email is not null and coalesce(p.product, true)),
      'newsletter', (select count(*) from public.email_prefs where newsletter),
      'newsletter_off_30d', (select count(*) from public.email_prefs where not newsletter and newsletter_off_at > now() - interval '30 days'),
      'product_off_30d', (select count(*) from public.email_prefs where not product and product_off_at > now() - interval '30 days'),
      'last_7d', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
          select kind, count(*) as n from public.email_log where status = 'sent' and created_at > now() - interval '7 days' group by kind) s),
      'total_sent', (select count(*) from public.email_log where status = 'sent'),
      'failed_7d', (select count(*) from public.email_log where status = 'failed' and created_at > now() - interval '7 days'),
      'sent_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d14.d, 'count',
          (select count(*) from public.email_log l where l.status = 'sent' and (l.created_at at time zone 'Europe/Zagreb')::date = d14.d)) order by d14.d), '[]'::jsonb) from d14)
    ),
    'generated_at', now()
  ) into v_out;
  return v_out;
end $$;

revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
