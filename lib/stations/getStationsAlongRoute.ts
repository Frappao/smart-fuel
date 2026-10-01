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

const EARTH_RADIUS_METERS = 6_378_137
const MAX_WEB_MERCATOR_LATITUDE = 85.05112878
// Keep the database pre-filter accurate while avoiding thousands of route
// vertices on long journeys. The corridor is expanded by the same amount
// whenever points are removed so stations near its boundary are not lost.
const ROUTE_SIMPLIFICATION_TOLERANCE_METERS = 25

interface ProjectedCoordinate {
  x: number
  y: number
}

function projectCoordinate([
  longitude,
  latitude,
]: [number, number]): ProjectedCoordinate {
  const clampedLatitude = Math.max(
    -MAX_WEB_MERCATOR_LATITUDE,
    Math.min(MAX_WEB_MERCATOR_LATITUDE, latitude),
  )

  return {
    x: EARTH_RADIUS_METERS * longitude * (Math.PI / 180),
    y:
      EARTH_RADIUS_METERS *
      Math.log(
        Math.tan(Math.PI / 4 + clampedLatitude * (Math.PI / 360)),
      ),
  }
}

function squaredDistanceToSegment(
  point: ProjectedCoordinate,
  start: ProjectedCoordinate,
  end: ProjectedCoordinate,
): number {
  const segmentX = end.x - start.x
  const segmentY = end.y - start.y
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2
  const projection =
    segmentLengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * segmentX +
              (point.y - start.y) * segmentY) /
              segmentLengthSquared,
          ),
        )
  const closestX = start.x + projection * segmentX
  const closestY = start.y + projection * segmentY

  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2
}

function simplifyRoute(
  route: RouteLineString,
  toleranceMeters: number,
): RouteLineString {
  if (route.coordinates.length <= 2) {
    return route
  }

  const projectedCoordinates = route.coordinates.map(projectCoordinate)
  const keep = new Uint8Array(route.coordinates.length)
  const toleranceSquared = toleranceMeters ** 2
  const segments: Array<[number, number]> = [
    [0, route.coordinates.length - 1],
  ]
  keep[0] = 1
  keep[route.coordinates.length - 1] = 1

  while (segments.length > 0) {
    const [startIndex, endIndex] = segments.pop()!
    let furthestIndex = -1
    let furthestDistanceSquared = toleranceSquared

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distanceSquared = squaredDistanceToSegment(
        projectedCoordinates[index],
        projectedCoordinates[startIndex],
        projectedCoordinates[endIndex],
      )

      if (distanceSquared > furthestDistanceSquared) {
        furthestIndex = index
        furthestDistanceSquared = distanceSquared
      }
    }

    if (furthestIndex !== -1) {
      keep[furthestIndex] = 1
      segments.push(
        [startIndex, furthestIndex],
        [furthestIndex, endIndex],
      )
    }
  }

  return {
    type: 'LineString',
    coordinates: route.coordinates.filter((_, index) => keep[index] === 1),
  }
}

export async function getStationsAlongRoute(
  route: RouteLineString,
  corridorMeters = 2_000,
  limit = 20,
  fuelType: SupportedFuelType = 'Benzina',
  isSelf = true,
): Promise<NearbyStation[]> {
  const supabase = createSupabaseServerClient()
  const simplifiedRoute = simplifyRoute(
    route,
    ROUTE_SIMPLIFICATION_TOLERANCE_METERS,
  )
  const routeWasSimplified =
    simplifiedRoute.coordinates.length < route.coordinates.length
  const { data, error } = await supabase.rpc('stations_along_route', {
    route_geojson: JSON.stringify(simplifiedRoute),
    corridor_meters:
      corridorMeters +
      (routeWasSimplified ? ROUTE_SIMPLIFICATION_TOLERANCE_METERS : 0),
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
