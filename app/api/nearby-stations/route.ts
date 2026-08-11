import { isSupportedFuelType } from '../../../lib/fuels/supportedFuelTypes'
import { getNearbyStations } from '../../../lib/stations/getNearbyStations'

const DEFAULT_RADIUS_METERS = 15_000
const DEFAULT_LIMIT = 20
const DEFAULT_FUEL_TYPE = 'Benzina'

function parseNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function parseIsSelf(value: string): boolean | null {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return null
}

export async function GET(request: Request): Promise<Response> {
  const searchParams = new URL(request.url).searchParams
  const latitude = parseNumber(searchParams.get('lat'))
  const longitude = parseNumber(searchParams.get('lng'))
  const radiusParam = searchParams.get('radius')
  const limitParam = searchParams.get('limit')
  const isSelfParam = searchParams.get('isSelf')
  const fuelType = searchParams.get('fuelType') ?? DEFAULT_FUEL_TYPE
  const radiusMeters =
    radiusParam === null ? DEFAULT_RADIUS_METERS : parseNumber(radiusParam)
  const limit = limitParam === null ? DEFAULT_LIMIT : parseNumber(limitParam)
  const isSelf = isSelfParam === null ? true : parseIsSelf(isSelfParam)

  const hasInvalidInput =
    latitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude === null ||
    longitude < -180 ||
    longitude > 180 ||
    radiusMeters === null ||
    radiusMeters <= 0 ||
    limit === null ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !isSupportedFuelType(fuelType) ||
    isSelf === null

  if (hasInvalidInput) {
    return Response.json(
      {
        error:
          'Invalid query parameters. lat must be between -90 and 90, lng between -180 and 180, radius greater than 0, limit an integer between 1 and 100, fuelType one of Benzina, Gasolio, or GPL, and isSelf must be true or false.',
      },
      { status: 400 },
    )
  }

  try {
    const stations = await getNearbyStations(
      latitude,
      longitude,
      radiusMeters,
      limit,
      fuelType,
      isSelf,
    )

    return Response.json({ stations })
  } catch {
    return Response.json(
      { error: 'Unable to retrieve nearby stations.' },
      { status: 500 },
    )
  }
}
