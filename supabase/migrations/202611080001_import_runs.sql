begin;

-- Storico delle esecuzioni dell'import MIMIT (cron giornaliero).
-- Tabella interna: scritta solo dal backend con la service role.
create table if not exists public.import_runs (
  id bigint generated always as identity primary key,
  source text not null default 'mimit',
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  duration_ms integer,
  status text not null check (status in ('success', 'error')),
  stations_imported integer,
  fuel_prices_imported integer,
  fuel_prices_skipped integer,
  error_message text
);

create index if not exists import_runs_started_at_idx
  on public.import_runs (started_at desc);

alter table public.import_runs enable row level security;
revoke all on public.import_runs from public, anon, authenticated;

commit;
