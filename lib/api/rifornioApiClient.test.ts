import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildApiUrl,
  fetchNearbyStations,
  fetchRouteMatrix,
} from './rifornioApiClient'

const fetchMock = vi.fn()

function arrangeResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('Rifornio API client', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a relative URL when no base URL is provided', () => {
    expect(buildApiUrl('/api/nearby-stations')).toBe('/api/nearby-stations')
  })

  it('builds an absolute URL when a base URL is provided', () => {
    expect(
      buildApiUrl('/api/nearby-stations', 'https://rifornio.it'),
    ).toBe('https://rifornio.it/api/nearby-stations')
  })

  it.each([
    ['Benzina', true],
    ['Gasolio', false],
  ] as const)(
    'serializes fuelType=%s and isSelf=%s for nearby stations',
    async (fuelType, isSelf) => {
      arrangeResponse({ stations: [] })

      await fetchNearbyStations({
        latitude: 45.4642,
        longitude: 9.19,
        radius: 15_000,
        limit: 20,
        fuelType,
        isSelf,
      })

      expect(fetchMock).toHaveBeenCalledWith(
        `/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20&fuelType=${fuelType}&isSelf=${isSelf}`,
      )
    },
  )

  it('sends the route matrix request as JSON with POST', async () => {
    const request = {
      origin: { latitude: 45.4642, longitude: 9.19 },
      destinations: [
        { latitude: 45.47, longitude: 9.18 },
        { latitude: 45.45, longitude: 9.21 },
      ],
    }
    arrangeResponse({ routes: [] })

    await fetchRouteMatrix(request)

    expect(fetchMock).toHaveBeenCalledWith('/api/route-matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  })

  it('turns a non-ok HTTP response into a controlled error', async () => {
    arrangeResponse({ error: 'Sensitive internal detail' }, false, 502)

    await expect(
      fetchRouteMatrix({
        origin: { latitude: 45.4642, longitude: 9.19 },
        destinations: [],
      }),
    ).rejects.toThrow('Route matrix request failed with HTTP status 502.')
  })
})
