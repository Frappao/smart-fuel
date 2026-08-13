import type { SupportedFuelType } from '../fuels/supportedFuelTypes'

export interface NearbyStation {
  id: number
  mimitId: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number
  longitude: number
  distanceMeters: number
  fuelPrice: number | null
  communicatedAt: string | null
}

export interface NearbyStationsRequest {
  latitude: number
  longitude: number
  radius: number
  limit: number
  fuelType: SupportedFuelType
  isSelf: boolean
}

export interface NearbyStationsResponse {
  stations: NearbyStation[]
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface RouteMatrixRequest {
  origin: Coordinates
  destinations: Coordinates[]
}

export interface RouteMatrixResponse {
  routes: unknown[]
}

export class RifornioApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'RifornioApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNearbyStationsResponse(
  value: unknown,
): value is NearbyStationsResponse {
  return isRecord(value) && Array.isArray(value.stations)
}

function isRouteMatrixResponse(value: unknown): value is RouteMatrixResponse {
  return isRecord(value) && Array.isArray(value.routes)
}

export function buildApiUrl(path: string, baseUrl?: string): string {
  return baseUrl ? new URL(path, baseUrl).toString() : path
}

async function readResponseJson(
  response: Response,
  requestName: string,
): Promise<unknown> {
  if (!response.ok) {
    throw new RifornioApiError(
      `${requestName} failed with HTTP status ${response.status}.`,
      response.status,
    )
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`${requestName} returned invalid JSON.`)
  }
}

export async function fetchNearbyStations(
  request: NearbyStationsRequest,
  baseUrl?: string,
): Promise<NearbyStationsResponse> {
  const searchParams = new URLSearchParams({
    lat: String(request.latitude),
    lng: String(request.longitude),
    radius: String(request.radius),
    limit: String(request.limit),
    fuelType: request.fuelType,
    isSelf: String(request.isSelf),
  })
  const response = await fetch(
    buildApiUrl(`/api/nearby-stations?${searchParams}`, baseUrl),
  )
  const responseBody = await readResponseJson(
    response,
    'Nearby stations request',
  )

  if (!isNearbyStationsResponse(responseBody)) {
    throw new Error('Nearby stations request returned an invalid response.')
  }

  return responseBody
}

export async function fetchRouteMatrix(
  request: RouteMatrixRequest,
  baseUrl?: string,
): Promise<RouteMatrixResponse> {
  const response = await fetch(buildApiUrl('/api/route-matrix', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const responseBody = await readResponseJson(response, 'Route matrix request')

  if (!isRouteMatrixResponse(responseBody)) {
    throw new Error('Route matrix request returned an invalid response.')
  }

  return responseBody
}
