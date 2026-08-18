import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'
import { POST } from './route'

vi.mock('../../../lib/maps/getMapboxRouteMatrix', () => ({
  getMapboxRouteMatrix: vi.fn(),
}))

const origin = { latitude: 45.4642, longitude: 9.19 }
const destinations = [
  { latitude: 45.47, longitude: 9.18 },
  { latitude: 45.45, longitude: 9.21 },
]

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/route-matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/route-matrix', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('passes valid origin and destinations to getMapboxRouteMatrix', async () => {
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([])

    const response = await POST(createRequest({ origin, destinations }))

    expect(getMapboxRouteMatrix).toHaveBeenCalledWith(origin, destinations)
    expect(response.status).toBe(200)
  })

  it('accepts at most 20 destinations', async () => {
    const twentyDestinations = Array.from({ length: 20 }, (_, index) => ({
      latitude: 45 + index / 100,
      longitude: 9 + index / 100,
    }))
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([])

    const acceptedResponse = await POST(
      createRequest({ origin, destinations: twentyDestinations }),
    )

    expect(acceptedResponse.status).toBe(200)
    expect(getMapboxRouteMatrix).toHaveBeenCalledWith(
      origin,
      twentyDestinations,
    )

    vi.mocked(getMapboxRouteMatrix).mockClear()

    const rejectedResponse = await POST(
      createRequest({
        origin,
        destinations: [
          ...twentyDestinations,
          { latitude: 45.5, longitude: 9.5 },
        ],
      }),
    )

    expect(rejectedResponse.status).toBe(400)
    expect(getMapboxRouteMatrix).not.toHaveBeenCalled()
  })

  it.each([
    [
      'origin',
      { origin: { latitude: 91, longitude: 9.19 }, destinations },
    ],
    [
      'destination',
      {
        origin,
        destinations: [{ latitude: 45.47, longitude: 181 }],
      },
    ],
  ])('returns 400 for invalid %s coordinates', async (_label, body) => {
    const response = await POST(createRequest(body))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: expect.any(String),
    })
    expect(getMapboxRouteMatrix).not.toHaveBeenCalled()
  })

  it('returns routes immediately for an empty destinations array', async () => {
    const response = await POST(createRequest({ origin, destinations: [] }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ routes: [] })
    expect(getMapboxRouteMatrix).not.toHaveBeenCalled()
  })

  it('returns a generic 502 without exposing Mapbox credentials', async () => {
    const sensitiveToken = 'sensitive-mapbox-token'
    vi.mocked(getMapboxRouteMatrix).mockRejectedValue(
      new Error(
        `Mapbox failed at https://api.mapbox.com/matrix?access_token=${sensitiveToken}`,
      ),
    )

    const response = await POST(createRequest({ origin, destinations }))
    const responseBody = await response.json()

    expect(response.status).toBe(502)
    expect(responseBody).toEqual({
      error: 'Unable to retrieve route distances.',
    })
    expect(JSON.stringify(responseBody)).not.toContain(sensitiveToken)
    expect(JSON.stringify(responseBody)).not.toContain('api.mapbox.com')
  })

  it('preserves destinationIndex and distanceMeters in a 200 response', async () => {
    const routes = [
      {
        destinationIndex: 0,
        distanceMeters: 4_350,
      },
      {
        destinationIndex: 1,
        distanceMeters: 8_120,
      },
    ]
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue(routes)

    const response = await POST(createRequest({ origin, destinations }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ routes })
  })

  it('returns valid routes when one destination has no route', async () => {
    const threeDestinations = [
      ...destinations,
      { latitude: 45.49, longitude: 9.23 },
    ]
    const availableRoutes = [
      { destinationIndex: 0, distanceMeters: 4_350 },
      { destinationIndex: 2, distanceMeters: 9_480 },
    ]
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue(availableRoutes)

    const response = await POST(
      createRequest({ origin, destinations: threeDestinations }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      routes: availableRoutes,
    })
  })
})
