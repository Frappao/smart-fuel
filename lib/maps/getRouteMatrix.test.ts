import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getRouteMatrix } from './getRouteMatrix'

const TEST_API_KEY = 'test-google-maps-api-key'
const ROUTE_MATRIX_URL =
  'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
const ROUTE_MATRIX_FIELD_MASK =
  'originIndex,destinationIndex,status,condition,distanceMeters,duration'

const fetchMock = vi.fn()

function arrangeGoogleResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('getRouteMatrix', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('GOOGLE_MAPS_API_KEY', TEST_API_KEY)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns an empty array without calling fetch for no destinations', async () => {
    await expect(
      getRouteMatrix({ latitude: 45.4642, longitude: 9.19 }, []),
    ).resolves.toEqual([])

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends the expected POST request, headers, and route matrix body', async () => {
    arrangeGoogleResponse([])
    const origin = { latitude: 45.4642, longitude: 9.19 }
    const destinations = [
      { latitude: 45.47, longitude: 9.2 },
      { latitude: 45.48, longitude: 9.21 },
    ]

    await getRouteMatrix(origin, destinations)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(ROUTE_MATRIX_URL)

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = new Headers(requestInit.headers)

    expect(requestInit.method).toBe('POST')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Goog-Api-Key')).toBe(TEST_API_KEY)
    expect(headers.get('X-Goog-FieldMask')).toBe(ROUTE_MATRIX_FIELD_MASK)
    expect(JSON.parse(requestInit.body as string)).toEqual({
      origins: [
        {
          waypoint: {
            location: {
              latLng: origin,
            },
          },
        },
      ],
      destinations: destinations.map((destination) => ({
        waypoint: {
          location: {
            latLng: destination,
          },
        },
      })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    })
  })

  it('maps durations and sorts valid results by destinationIndex', async () => {
    arrangeGoogleResponse([
      {
        originIndex: 0,
        destinationIndex: 1,
        distanceMeters: 8_120,
        duration: '735.5s',
        condition: 'ROUTE_EXISTS',
        status: {},
      },
      {
        originIndex: 0,
        destinationIndex: 0,
        distanceMeters: 4_350,
        duration: '420s',
        condition: 'ROUTE_EXISTS',
        status: {},
      },
    ])

    await expect(
      getRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [
          { latitude: 45.47, longitude: 9.2 },
          { latitude: 45.48, longitude: 9.21 },
        ],
      ),
    ).resolves.toEqual([
      {
        destinationIndex: 0,
        distanceMeters: 4_350,
        durationSeconds: 420,
      },
      {
        destinationIndex: 1,
        distanceMeters: 8_120,
        durationSeconds: 735.5,
      },
    ])
  })

  it('throws an HTTP error without exposing the API key', async () => {
    arrangeGoogleResponse({ error: 'Forbidden' }, false, 403)

    let caughtError: unknown

    try {
      await getRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [{ latitude: 45.47, longitude: 9.2 }],
      )
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(Error)

    if (caughtError instanceof Error) {
      expect(caughtError.message).toContain('HTTP status 403')
      expect(caughtError.message).not.toContain(TEST_API_KEY)
    }
  })

  it('excludes route matrix elements without a valid route', async () => {
    arrangeGoogleResponse([
      {
        originIndex: 0,
        destinationIndex: 0,
        distanceMeters: 4_350,
        duration: '420s',
        condition: 'ROUTE_EXISTS',
        status: {},
      },
      {
        originIndex: 0,
        destinationIndex: 1,
        condition: 'ROUTE_NOT_FOUND',
        status: { code: 5, message: 'No route found' },
      },
    ])

    await expect(
      getRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [
          { latitude: 45.47, longitude: 9.2 },
          { latitude: 45.48, longitude: 9.21 },
        ],
      ),
    ).resolves.toEqual([
      {
        destinationIndex: 0,
        distanceMeters: 4_350,
        durationSeconds: 420,
      },
    ])
  })
})
