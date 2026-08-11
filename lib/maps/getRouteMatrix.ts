import 'server-only'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface RouteMatrixDestination {
  latitude: number
  longitude: number
}

export interface RouteMatrixResult {
  destinationIndex: number
  distanceMeters: number
  durationSeconds: number
}

const ROUTE_MATRIX_URL =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'

const ROUTE_MATRIX_FIELD_MASK =
  'originIndex,destinationIndex,status,condition,distanceMeters,duration'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasSuccessfulStatus(status: unknown): boolean {
  if (status === undefined || status === null) {
    return true
  }

  if (!isRecord(status)) {
    return false
  }

  if ('code' in status && status.code !== 0) {
    return false
  }

  return !(
    typeof status.message === 'string' && status.message.trim().length > 0
  )
}

function parseDurationSeconds(duration: unknown): number | null {
  if (typeof duration !== 'string') {
    return null
  }

  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration)

  if (!match) {
    return null
  }

  const seconds = Number(match[1])

  return Number.isFinite(seconds) ? seconds : null
}

export async function getRouteMatrix(
  origin: Coordinates,
  destinations: RouteMatrixDestination[],
): Promise<RouteMatrixResult[]> {
  if (destinations.length === 0) {
    return []
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing GOOGLE_MAPS_API_KEY: configure it in the server environment before requesting route distances.',
    )
  }

  const response = await fetch(ROUTE_MATRIX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': ROUTE_MATRIX_FIELD_MASK,
    },
    body: JSON.stringify({
      origins: [
        {
          waypoint: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude,
              },
            },
          },
        },
      ],
      destinations: destinations.map((destination) => ({
        waypoint: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
      })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Google Routes request failed with HTTP status ${response.status}.`,
    )
  }

  const responseBody: unknown = await response.json()

  if (!Array.isArray(responseBody)) {
    throw new Error('Google Routes returned an invalid route matrix response.')
  }

  const results: RouteMatrixResult[] = []

  for (const element of responseBody) {
    if (!isRecord(element)) {
      continue
    }

    const { destinationIndex, distanceMeters, duration, status } = element
    const durationSeconds = parseDurationSeconds(duration)

    if (
      !Number.isInteger(destinationIndex) ||
      typeof destinationIndex !== 'number' ||
      destinationIndex < 0 ||
      destinationIndex >= destinations.length ||
      typeof distanceMeters !== 'number' ||
      !Number.isFinite(distanceMeters) ||
      distanceMeters < 0 ||
      durationSeconds === null ||
      !hasSuccessfulStatus(status)
    ) {
      continue
    }

    results.push({
      destinationIndex,
      distanceMeters,
      durationSeconds,
    })
  }

  return results.sort(
    (first, second) => first.destinationIndex - second.destinationIndex,
  )
}
