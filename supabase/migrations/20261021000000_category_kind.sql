-- Vrsta kategorije: trošak ili prihod (sync_push čita stupce dinamički, pa nije potrebna izmjena funkcije).
alter table public.categories add column if not exists kind text not null default 'expense' check (kind in ('expense','income'));
