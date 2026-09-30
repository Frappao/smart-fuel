import 'server-only'

export interface GeocodingResult {
  id: string
  label: string
  latitude: number
  longitude: number
}

const MAPBOX_GEOCODING_URL =
  'https://api.mapbox.com/search/geocode/v6/forward'
const RESULT_LIMIT = 5

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseFeature(value: unknown): GeocodingResult | null {
  if (!isRecord(value) || !isRecord(value.properties)) {
    return null
  }

  const { geometry, properties } = value

  if (
    !isRecord(geometry) ||
    geometry.type !== 'Point' ||
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    return null
  }

  const [longitude, latitude] = geometry.coordinates
  const id = properties.mapbox_id
  const label =
    properties.full_address ??
    [properties.name_preferred ?? properties.name, properties.place_formatted]
      .filter((part): part is string =>
        typeof part === 'string' && part.trim().length > 0,
      )
      .join(', ')

  if (
    typeof id !== 'string' ||
    id.trim().length === 0 ||
    typeof label !== 'string' ||
    label.trim().length === 0 ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  return {
    id,
    label: label.trim(),
    latitude,
    longitude,
  }
}

export async function geocodeAddress(
  query: string,
): Promise<GeocodingResult[]> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const url = new URL(MAPBOX_GEOCODING_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('country', 'it')
  url.searchParams.set('language', 'it')
  url.searchParams.set('autocomplete', 'false')
  url.searchParams.set('limit', String(RESULT_LIMIT))
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Mapbox Geocoding request failed with HTTP status ${response.status}.`,
    )
  }

  const body: unknown = await response.json()

  if (!isRecord(body) || !Array.isArray(body.features)) {
    throw new Error('Mapbox Geocoding returned an invalid response.')
  }

  return body.features.flatMap((feature) => {
    const result = parseFeature(feature)

    return result ? [result] : []
  })
}
