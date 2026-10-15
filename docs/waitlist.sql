-- Pokreni jednom u Supabase: SQL Editor -> New query.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_at timestamptz not null,
  source text,
  created_at timestamptz not null default now()
);

-- Samo poslužitelj (service role) smije pisati i čitati. Javni (anon) pristup je zatvoren.
alter table public.waitlist enable row level security;
