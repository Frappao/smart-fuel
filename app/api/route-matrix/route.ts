import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'

interface Coordinates {
  latitude: number
  longitude: number
}

type RouteMatrixDestination = Coordinates

const MAX_DESTINATIONS = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidCoordinates(value: unknown): value is Coordinates {
  if (!isRecord(value)) {
    return false
  }

  const { latitude, longitude } = value

  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function invalidInputResponse(): Response {
  return Response.json(
    {
      error:
        'Invalid input. Provide a valid origin and between 0 and 20 valid destinations.',
    },
    { status: 400 },
  )
}

export async function POST(request: Request): Promise<Response> {
  let requestBody: unknown

  try {
    requestBody = await request.json()
  } catch {
    return invalidInputResponse()
  }

  if (!isRecord(requestBody)) {
    return invalidInputResponse()
  }

  const { origin, destinations } = requestBody

  if (
    !isValidCoordinates(origin) ||
    !Array.isArray(destinations) ||
    destinations.length > MAX_DESTINATIONS ||
    !destinations.every(isValidCoordinates)
  ) {
    return invalidInputResponse()
  }

  if (destinations.length === 0) {
    return Response.json({ routes: [] })
  }

  try {
    const routes = await getMapboxRouteMatrix(
      origin,
      destinations as RouteMatrixDestination[],
    )

    return Response.json({ routes })
  } catch {
    return Response.json(
      { error: 'Unable to retrieve route distances.' },
      { status: 502 },
    )
  }
}
