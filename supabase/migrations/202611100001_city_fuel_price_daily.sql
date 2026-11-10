begin;

-- Storico giornaliero dei prezzi medi per città (pagine /prezzi-carburanti/[citta]).
-- fuel_prices contiene solo l'ultimo prezzo: questa tabella conserva una
-- fotografia aggregata al giorno, scritta dal cron dopo l'import MIMIT.
-- Serie allineate alle statistiche della pagina città:
--   benzina_self = Benzina self, gasolio_self = Gasolio self, gpl = GPL (self e servito).
create table if not exists public.city_fuel_price_daily (
  city text not null,
  province text,
  price_date date not null,
  series text not null check (series in ('benzina_self', 'gasolio_self', 'gpl')),
  avg_price numeric(6,3) not null,
  min_price numeric(6,3) not null,
  max_price numeric(6,3) not null,
  station_count integer not null,
  created_at timestamptz not null default now(),
  primary key (city, series, price_date)
);

create index if not exists city_fuel_price_daily_city_date_idx
  on public.city_fuel_price_daily (city, price_date desc);

-- Tabella interna: letta e scritta solo dal backend con la service role.
alter table public.city_fuel_price_daily enable row level security;
revoke all on public.city_fuel_price_daily from public, anon, authenticated;

-- Aggrega i prezzi correnti delle città indicate e salva la fotografia del giorno.
-- Idempotente: rieseguirla nello stesso giorno aggiorna le righe esistenti.
create or replace function public.snapshot_city_fuel_prices(
  p_cities text[],
  p_date date default (now() at time zone 'Europe/Rome')::date
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  affected integer;
begin
  insert into public.city_fuel_price_daily (
    city, province, price_date, series,
    avg_price, min_price, max_price, station_count
  )
  select
    upper(trim(s.city)) as city,
    max(s.province) as province,
    p_date,
    x.series,
    round(avg(fp.price), 3),
    min(fp.price),
    max(fp.price),
    count(distinct s.id)::integer
  from public.stations s
  join public.fuel_prices fp on fp.station_id = s.id
  cross join lateral (
    select case
      when fp.fuel_type = 'Benzina' and fp.is_self then 'benzina_self'
      when fp.fuel_type = 'Gasolio' and fp.is_self then 'gasolio_self'
      when fp.fuel_type = 'GPL' then 'gpl'
    end as series
  ) x
  where x.series is not null
    and fp.price > 0
    and upper(trim(s.city)) = any (
      select upper(trim(c)) from unnest(p_cities) as c
    )
  group by upper(trim(s.city)), x.series
  on conflict (city, series, price_date) do update set
    province = excluded.province,
    avg_price = excluded.avg_price,
    min_price = excluded.min_price,
    max_price = excluded.max_price,
    station_count = excluded.station_count,
    created_at = now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.snapshot_city_fuel_prices(text[], date)
  from public, anon, authenticated;
grant execute on function public.snapshot_city_fuel_prices(text[], date)
  to service_role;

commit;
