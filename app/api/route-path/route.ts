import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'

// Percorso stradale reale (geometria GeoJSON) dalla posizione dell'utente al
// distributore vincente, da disegnare sulla mappa dei risultati. Serve solo
// alla visualizzazione: la classifica continua a usare /api/route-matrix.

interface Coordinates {
  latitude: number
  longitude: number
}

// La ricerca "vicino a me" usa un raggio di 15 km: oltre questa distanza in
// linea d'aria la richiesta non arriva dall'interfaccia e non va inoltrata
// a Mapbox.
const MAX_STRAIGHT_LINE_DISTANCE_METERS = 50_000
const EARTH_RADIUS_METERS = 6_371_000

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

function straightLineDistanceMeters(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}

function invalidInputResponse(): Response {
  return Response.json(
    {
      error:
        'Invalid input. Provide a valid origin and a destination within 50 km.',
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

  const { origin, destination } = requestBody

  if (
    !isValidCoordinates(origin) ||
    !isValidCoordinates(destination) ||
    straightLineDistanceMeters(origin, destination) >
      MAX_STRAIGHT_LINE_DISTANCE_METERS
  ) {
    return invalidInputResponse()
  }

  try {
    const route = await getMapboxDirections(origin, destination)

    return Response.json({
      distanceMeters: route.distanceMeters,
      geometry: route.geometry,
    })
  } catch {
    return Response.json(
      { error: 'Unable to retrieve the route path.' },
      { status: 502 },
    )
  }
}
