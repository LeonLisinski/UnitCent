-- Predmemorija AI uvida: jedan red po korisniku i mjesecu. Piše samo Edge Function (service_role).
create table if not exists public.insights_cache (
  user_id     uuid not null references auth.users(id) on delete cascade,
  month       text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  facts_hash  text not null,
  items       jsonb not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, month)
);
alter table public.insights_cache enable row level security;
-- Klijent nema pristup; sve ide preko funkcije.
