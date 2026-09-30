import 'server-only'

import type { Coordinates } from './getRouteMatrix'

export interface MapboxRouteToDestinationResult {
  destinationIndex: number
  distanceMeters: number
}

const MAPBOX_MATRIX_URL =
  'https://api.mapbox.com/directions-matrix/v1/mapbox/driving'
const MAX_ORIGINS = 20

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function coordinatePair({ latitude, longitude }: Coordinates): string {
  return `${longitude},${latitude}`
}

export async function getMapboxRoutesToDestination(
  origins: Coordinates[],
  destination: Coordinates,
): Promise<MapboxRouteToDestinationResult[]> {
  if (origins.length === 0) {
    return []
  }

  if (origins.length > MAX_ORIGINS) {
    throw new Error('Mapbox Matrix supports at most 20 route origins.')
  }

  if (!isValidCoordinates(destination) || !origins.every(isValidCoordinates)) {
    throw new Error('Mapbox Matrix requires valid coordinates.')
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const coordinates = [...origins, destination].map(coordinatePair).join(';')
  const destinationCoordinateIndex = origins.length
  const url = new URL(`${MAPBOX_MATRIX_URL}/${coordinates}`)
  url.searchParams.set(
    'sources',
    origins.map((_, index) => String(index)).join(';'),
  )
  url.searchParams.set('destinations', String(destinationCoordinateIndex))
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
    body.distances.length !== origins.length ||
    !body.distances.every(
      (row) => Array.isArray(row) && row.length === 1,
    )
  ) {
    throw new Error('Mapbox Matrix returned an invalid response.')
  }

  return body.distances.flatMap((row, destinationIndex) => {
    const distance = row[0]

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
