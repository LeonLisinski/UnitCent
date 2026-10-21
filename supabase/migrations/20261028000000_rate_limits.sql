-- UnitCent: ograničenje broja poziva Edge Functiona (faza H). Fiksni prozor po ključu „funkcija:korisnik“.
-- Štiti od naleta i skripti (posebno AI pozive koji nas koštaju), uz postojeće mjesečne kvote (skeniranje, savjetnik).
-- Piše i čita samo service_role (Edge Functions); klijent nema pristup.

create table if not exists public.rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (bucket, window_start)
);
alter table public.rate_limits enable row level security;

-- Vraća true ako je poziv dopušten (broj u ovom prozoru ≤ p_limit). Stari prozori se povremeno brišu.
create or replace function public.rate_hit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits as r (bucket, window_start, count) values (p_bucket, v_start, 1)
    on conflict (bucket, window_start) do update set count = r.count + 1
  returning count into v_count;
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_count <= p_limit;
end $$;

revoke all on function public.rate_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_hit(text, integer, integer) to service_role;
