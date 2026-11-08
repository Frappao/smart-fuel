import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'
import { POST } from './route'

vi.mock('../../../lib/maps/getMapboxDirections', () => ({
  getMapboxDirections: vi.fn(),
}))

const origin = { latitude: 45.4642, longitude: 9.19 }
const destination = { latitude: 45.47, longitude: 9.18 }
const geometry = {
  type: 'LineString' as const,
  coordinates: [
    [9.19, 45.4642],
    [9.185, 45.468],
    [9.18, 45.47],
  ] as [number, number][],
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/route-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/route-path', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the real driving route geometry', async () => {
    vi.mocked(getMapboxDirections).mockResolvedValue({
      distanceMeters: 1_234,
      geometry,
    })

    const response = await POST(createRequest({ origin, destination }))

    expect(getMapboxDirections).toHaveBeenCalledWith(origin, destination)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ distanceMeters: 1_234, geometry })
  })

  it.each([
    ['invalid JSON', '{'],
    ['a missing destination', { origin }],
    ['invalid coordinates', { origin, destination: { latitude: 120, longitude: 9 } }],
    [
      'a destination farther than 50 km',
      { origin, destination: { latitude: 44.4949, longitude: 11.3426 } },
    ],
  ])('rejects %s without calling Mapbox', async (_case, body) => {
    const response = await POST(createRequest(body))

    expect(response.status).toBe(400)
    expect(getMapboxDirections).not.toHaveBeenCalled()
  })

  it('returns 502 when Mapbox fails', async () => {
    vi.mocked(getMapboxDirections).mockRejectedValue(new Error('boom'))

    const response = await POST(createRequest({ origin, destination }))

    expect(response.status).toBe(502)
  })
})
