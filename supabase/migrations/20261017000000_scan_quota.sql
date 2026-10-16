-- UnitCent: Faza 3. Kvota skeniranja (provodi samo poslužitelj; klijent smije samo čitati scan_usage).
-- consume_scan: atomarno povećava brojač ako je ispod granice; vraća novi brojač ili NULL kad je granica dosegnuta.
-- refund_scan: vraća jedno skeniranje kad AI poziv ne uspije (korisnik ne plaća neuspjeh).

create or replace function public.consume_scan(p_user uuid, p_month text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare c integer;
begin
  insert into public.scan_usage (user_id, month, count) values (p_user, p_month, 0)
    on conflict (user_id, month) do nothing;
  update public.scan_usage set count = count + 1
   where user_id = p_user and month = p_month and count < p_limit
  returning count into c;
  return c;
end $$;

create or replace function public.refund_scan(p_user uuid, p_month text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.scan_usage set count = greatest(count - 1, 0) where user_id = p_user and month = p_month;
$$;

revoke all on function public.consume_scan(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.refund_scan(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_scan(uuid, text, integer) to service_role;
grant execute on function public.refund_scan(uuid, text) to service_role;
