import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'

export interface NearbyStation {
  id: number
  mimitId: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number
  longitude: number
  distanceMeters: number
  fuelPrice: number | null
  communicatedAt: string | null
}

interface NearbyStationDatabaseRow {
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

export async function getNearbyStations(
  latitude: number,
  longitude: number,
  radiusMeters = 15_000,
  limit = 20,
): Promise<NearbyStation[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.rpc('nearby_stations', {
    user_lat: latitude,
    user_lng: longitude,
    radius_meters: radiusMeters,
    result_limit: limit,
  })

  if (error) {
    throw new Error(`Nearby stations lookup failed: ${error.message}`)
  }

  return ((data ?? []) as NearbyStationDatabaseRow[]).map((station) => ({
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
