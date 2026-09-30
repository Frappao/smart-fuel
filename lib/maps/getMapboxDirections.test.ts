import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxDirections } from './getMapboxDirections'

const TEST_ACCESS_TOKEN = 'test-mapbox-access-token'
const fetchMock = vi.fn()
const origin = { latitude: 45.4642, longitude: 9.19 }
const destination = { latitude: 44.4949, longitude: 11.3426 }

function arrangeMapboxResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('getMapboxDirections', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', TEST_ACCESS_TOKEN)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns the full GeoJSON route and its driving distance', async () => {
    const geometry = {
      type: 'LineString' as const,
      coordinates: [
        [9.19, 45.4642],
        [10.2, 45.1],
        [11.3426, 44.4949],
      ],
    }
    arrangeMapboxResponse({
      code: 'Ok',
      routes: [{ distance: 214_350.5, geometry }],
    })

    await expect(
      getMapboxDirections(origin, destination),
    ).resolves.toEqual({ distanceMeters: 214_350.5, geometry })

    const requestUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestUrl).toBeInstanceOf(URL)

    const url = requestUrl as URL
    expect(decodeURIComponent(url.pathname)).toBe(
      '/directions/v5/mapbox/driving/9.19,45.4642;11.3426,44.4949',
    )
    expect(url.searchParams.get('geometries')).toBe('geojson')
    expect(url.searchParams.get('overview')).toBe('full')
    expect(url.searchParams.get('alternatives')).toBe('false')
    expect(url.searchParams.get('access_token')).toBe(TEST_ACCESS_TOKEN)
  })

  it('rejects invalid coordinates before calling Mapbox', async () => {
    await expect(
      getMapboxDirections({ latitude: 91, longitude: 9.19 }, destination),
    ).rejects.toThrow('Mapbox Directions requires valid coordinates.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects malformed routes and HTTP errors', async () => {
    arrangeMapboxResponse({
      code: 'Ok',
      routes: [
        {
          distance: 10,
          geometry: { type: 'LineString', coordinates: [[9.19, 45.4642]] },
        },
      ],
    })
    await expect(
      getMapboxDirections(origin, destination),
    ).rejects.toThrow('Mapbox Directions returned an invalid response.')

    arrangeMapboxResponse({ message: 'Too Many Requests' }, false, 429)
    await expect(
      getMapboxDirections(origin, destination),
    ).rejects.toThrow('HTTP status 429')
  })

  it('requires a server-side access token', async () => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '')

    await expect(
      getMapboxDirections(origin, destination),
    ).rejects.toThrow('MAPBOX_ACCESS_TOKEN is not configured.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
