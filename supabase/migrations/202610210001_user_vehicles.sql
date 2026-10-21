begin;
create table public.user_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  consumption double precision not null check (consumption > 0 and consumption < 'Infinity'::double precision and 100 / consumption > 0 and 100 / consumption < 'Infinity'::double precision),
  consumption_unit text not null check (consumption_unit in ('L/100 km', 'km/L')),
  fuel_type text not null check (fuel_type in ('Benzina', 'Gasolio', 'GPL')),
  created_at timestamptz not null default now()
);
create index user_vehicles_user_id_idx on public.user_vehicles(user_id);
alter table public.user_vehicles enable row level security;
revoke all on public.user_vehicles from public, anon, authenticated;
grant select, insert, update, delete on public.user_vehicles to authenticated;
create policy vehicles_select on public.user_vehicles for select to authenticated using ((select auth.uid()) = user_id);
create policy vehicles_insert on public.user_vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy vehicles_update on public.user_vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy vehicles_delete on public.user_vehicles for delete to authenticated using ((select auth.uid()) = user_id);
commit;
