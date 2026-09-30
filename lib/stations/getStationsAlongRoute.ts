import 'server-only'

import type { SupportedFuelType } from '../fuels/supportedFuelTypes'
import type { RouteLineString } from '../maps/getMapboxDirections'
import { createSupabaseServerClient } from '../supabase/server'
import type { NearbyStation } from './getNearbyStations'

interface StationAlongRouteDatabaseRow {
  id: number
  mimit_id: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number
  longitude: number
  distance_meters: number
  fuel_price: number | null
  communicated_at: string | null
}

export async function getStationsAlongRoute(
  route: RouteLineString,
  corridorMeters = 2_000,
  limit = 20,
  fuelType: SupportedFuelType = 'Benzina',
  isSelf = true,
): Promise<NearbyStation[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.rpc('stations_along_route', {
    route_geojson: JSON.stringify(route),
    corridor_meters: corridorMeters,
    result_limit: limit,
    requested_fuel_type: fuelType,
    requested_is_self: isSelf,
  })

  if (error) {
    throw new Error(`Stations along route lookup failed: ${error.message}`)
  }

  return ((data ?? []) as StationAlongRouteDatabaseRow[]).map((station) => ({
    id: station.id,
    mimitId: station.mimit_id,
    name: station.name,
    brand: station.brand,
    address: station.address,
    city: station.city,
    province: station.province,
    latitude: station.latitude,
    longitude: station.longitude,
    distanceMeters: station.distance_meters,
    fuelPrice: station.fuel_price,
    communicatedAt: station.communicated_at,
  }))
}
