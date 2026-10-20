-- D-13: početak usred mjeseca i stanje štednje (sync_push čita stupce dinamički, pa nije potrebna izmjena funkcije).
-- month_plans.spent_before_cents: potrošeno u tom mjesecu prije početka praćenja (procjena iz stanja na računu).
-- savings_entries.opening_cents: stanje štednje na početku tog mjeseca (null = nije postavljeno); ukupno ušteđeno =
--   zadnje postavljeno stanje + potvrđena štednja od tog mjeseca nadalje.
alter table public.month_plans
  add column if not exists spent_before_cents integer not null default 0 check (spent_before_cents >= 0);
alter table public.savings_entries
  add column if not exists opening_cents integer check (opening_cents is null or opening_cents >= 0);
