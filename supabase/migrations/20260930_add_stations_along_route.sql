-- Geographic pre-filter for route planning. Final candidate ranking must use
-- road detours from the routing provider, not this straight-line distance.
create or replace function public.stations_along_route(
  route_geojson text,
  corridor_meters double precision default 2000,
  result_limit integer default 20,
  requested_fuel_type text default 'Benzina',
  requested_is_self boolean default true
)
returns table (
  id bigint,
  mimit_id bigint,
  name text,
  brand text,
  address text,
  city text,
  province text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  fuel_price numeric,
  communicated_at timestamptz
)
language sql
stable
set search_path = public, gis
as $$
  with route as (
    select gis.st_setsrid(
      gis.st_geomfromgeojson(route_geojson),
      4326
    )::gis.geography as location
  )
  select
    stations.id,
    stations.mimit_id,
    stations.name,
    stations.brand,
    stations.address,
    stations.city,
    stations.province,
    stations.latitude,
    stations.longitude,
    gis.st_distance(stations.location, route.location) as distance_meters,
    fuel_prices.price as fuel_price,
    fuel_prices.communicated_at
  from public.stations
  cross join route
  join public.fuel_prices
    on fuel_prices.station_id = stations.id
    and fuel_prices.fuel_type = requested_fuel_type
    and fuel_prices.is_self = requested_is_self
  where stations.location is not null
    and gis.st_geometrytype(route.location::gis.geometry) = 'ST_LineString'
    and not gis.st_isempty(route.location::gis.geometry)
    and gis.st_isvalid(route.location::gis.geometry)
    and gis.st_dwithin(
      stations.location,
      route.location,
      corridor_meters
    )
  order by fuel_prices.price, distance_meters
  limit result_limit;
$$;
