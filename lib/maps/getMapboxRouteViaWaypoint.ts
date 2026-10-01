import 'server-only'

import type { Coordinates } from './getRouteMatrix'

export interface MapboxRouteViaWaypointResult {
  originToWaypointDistanceMeters: number
  waypointToDestinationDistanceMeters: number
}

const MAPBOX_DIRECTIONS_URL =
  'https://api.mapbox.com/directions/v5/mapbox/driving'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidCoordinates({ latitude, longitude }: Coordinates): boolean {
  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function coordinatePair({ latitude, longitude }: Coordinates): string {
  return `${longitude},${latitude}`
}

function getLegDistance(leg: unknown): number | null {
  if (
    !isRecord(leg) ||
    typeof leg.distance !== 'number' ||
    !Number.isFinite(leg.distance) ||
    leg.distance < 0
  ) {
    return null
  }

  return leg.distance
}

export async function getMapboxRouteViaWaypoint(
  origin: Coordinates,
  waypoint: Coordinates,
  destination: Coordinates,
): Promise<MapboxRouteViaWaypointResult> {
  if (
    !isValidCoordinates(origin) ||
    !isValidCoordinates(waypoint) ||
    !isValidCoordinates(destination)
  ) {
    throw new Error('Mapbox Directions requires valid coordinates.')
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const coordinates = [origin, waypoint, destination]
    .map(coordinatePair)
    .join(';')
  const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${coordinates}`)
  url.searchParams.set('alternatives', 'false')
  url.searchParams.set('overview', 'false')
  url.searchParams.set('steps', 'false')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Mapbox Directions request failed with HTTP status ${response.status}.`,
    )
  }

  const body: unknown = await response.json()
  const route =
    isRecord(body) && body.code === 'Ok' && Array.isArray(body.routes)
      ? body.routes[0]
      : null
  const legs = isRecord(route) && Array.isArray(route.legs) ? route.legs : []
  const originToWaypointDistanceMeters = getLegDistance(legs[0])
  const waypointToDestinationDistanceMeters = getLegDistance(legs[1])

  if (
    legs.length !== 2 ||
    originToWaypointDistanceMeters === null ||
    waypointToDestinationDistanceMeters === null
  ) {
    throw new Error('Mapbox Directions returned an invalid response.')
  }

  return {
    originToWaypointDistanceMeters,
    waypointToDestinationDistanceMeters,
  }
}
