import 'server-only'

import type {
  Coordinates,
  RouteMatrixDestination,
} from './getRouteMatrix'

export interface MapboxRouteMatrixResult {
  destinationIndex: number
  distanceMeters: number
}

const MAPBOX_MATRIX_URL =
  'https://api.mapbox.com/directions-matrix/v1/mapbox/driving'
const MAX_DESTINATIONS = 20

function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function coordinatePair(coordinates: Coordinates): string {
  return `${coordinates.longitude},${coordinates.latitude}`
}

export async function getMapboxRouteMatrix(
  origin: Coordinates,
  destinations: RouteMatrixDestination[],
): Promise<MapboxRouteMatrixResult[]> {
  if (destinations.length === 0) {
    return []
  }

  if (destinations.length > MAX_DESTINATIONS) {
    throw new Error('Mapbox Matrix supports at most 20 destinations.')
  }

  if (!isValidCoordinates(origin) || !destinations.every(isValidCoordinates)) {
    throw new Error('Mapbox Matrix requires valid coordinates.')
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const coordinates = [origin, ...destinations].map(coordinatePair).join(';')
  const url = new URL(`${MAPBOX_MATRIX_URL}/${coordinates}`)

  url.searchParams.set('sources', '0')
  url.searchParams.set(
    'destinations',
    destinations.map((_, index) => String(index + 1)).join(';'),
  )
  url.searchParams.set('annotations', 'distance')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Mapbox Matrix request failed with HTTP status ${response.status}.`,
    )
  }

  const body: unknown = await response.json()

  if (
    !isRecord(body) ||
    body.code !== 'Ok' ||
    !Array.isArray(body.distances) ||
    body.distances.length !== 1 ||
    !Array.isArray(body.distances[0]) ||
    body.distances[0].length !== destinations.length
  ) {
    throw new Error('Mapbox Matrix returned an invalid response.')
  }

  return body.distances[0].flatMap((distance, destinationIndex) => {
    if (distance === null) {
      return []
    }

    if (
      typeof distance !== 'number' ||
      !Number.isFinite(distance) ||
      distance < 0
    ) {
      throw new Error('Mapbox Matrix returned an invalid response.')
    }

    return [{ destinationIndex, distanceMeters: distance }]
  })
}
