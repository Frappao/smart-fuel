import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRouteMatrix } from '../../../lib/maps/getRouteMatrix'
import { POST } from './route'

vi.mock('../../../lib/maps/getRouteMatrix', () => ({
  getRouteMatrix: vi.fn(),
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

  it('passes valid origin and destinations to getRouteMatrix', async () => {
    vi.mocked(getRouteMatrix).mockResolvedValue([])

    const response = await POST(createRequest({ origin, destinations }))

    expect(getRouteMatrix).toHaveBeenCalledWith(origin, destinations)
    expect(response.status).toBe(200)
  })

  it('accepts at most 20 destinations', async () => {
    const twentyDestinations = Array.from({ length: 20 }, (_, index) => ({
      latitude: 45 + index / 100,
      longitude: 9 + index / 100,
    }))
    vi.mocked(getRouteMatrix).mockResolvedValue([])

    const acceptedResponse = await POST(
      createRequest({ origin, destinations: twentyDestinations }),
    )

    expect(acceptedResponse.status).toBe(200)
    expect(getRouteMatrix).toHaveBeenCalledWith(origin, twentyDestinations)

    vi.mocked(getRouteMatrix).mockClear()

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
    expect(getRouteMatrix).not.toHaveBeenCalled()
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
    expect(getRouteMatrix).not.toHaveBeenCalled()
  })

  it('returns routes immediately for an empty destinations array', async () => {
    const response = await POST(createRequest({ origin, destinations: [] }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ routes: [] })
    expect(getRouteMatrix).not.toHaveBeenCalled()
  })

  it('returns 502 when Google Routes fails', async () => {
    vi.mocked(getRouteMatrix).mockRejectedValue(
      new Error('Sensitive Google error'),
    )

    const response = await POST(createRequest({ origin, destinations }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to retrieve route distances.',
    })
  })

  it('returns routes as JSON with status 200', async () => {
    const routes = [
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
    ]
    vi.mocked(getRouteMatrix).mockResolvedValue(routes)

    const response = await POST(createRequest({ origin, destinations }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ routes })
  })
})
