import 'server-only'

import type { Coordinates } from './getRouteMatrix'

export interface RouteLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

export interface MapboxDirectionsResult {
  distanceMeters: number
  geometry: RouteLineString
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

function isLineStringCoordinate(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  )
}

function coordinatePair({ latitude, longitude }: Coordinates): string {
  return `${longitude},${latitude}`
}

export async function getMapboxDirections(
  origin: Coordinates,
  destination: Coordinates,
): Promise<MapboxDirectionsResult> {
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    throw new Error('Mapbox Directions requires valid coordinates.')
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const coordinates = `${coordinatePair(origin)};${coordinatePair(destination)}`
  const url = new URL(`${MAPBOX_DIRECTIONS_URL}/${coordinates}`)
  url.searchParams.set('alternatives', 'false')
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
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

  if (
    !isRecord(route) ||
    typeof route.distance !== 'number' ||
    !Number.isFinite(route.distance) ||
    route.distance < 0 ||
    !isRecord(route.geometry) ||
    route.geometry.type !== 'LineString' ||
    !Array.isArray(route.geometry.coordinates) ||
    route.geometry.coordinates.length < 2 ||
    !route.geometry.coordinates.every(isLineStringCoordinate)
  ) {
    throw new Error('Mapbox Directions returned an invalid response.')
  }

  return {
    distanceMeters: route.distance,
    geometry: {
      type: 'LineString',
      coordinates: route.geometry.coordinates,
    },
  }
}
