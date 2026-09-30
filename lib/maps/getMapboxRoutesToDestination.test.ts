import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxRoutesToDestination } from './getMapboxRoutesToDestination'

const TEST_ACCESS_TOKEN = 'test-mapbox-access-token'
const fetchMock = vi.fn()

function arrangeMapboxResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('getMapboxRoutesToDestination', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', TEST_ACCESS_TOKEN)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('builds an N-to-1 request and preserves origin indexes', async () => {
    arrangeMapboxResponse({ code: 'Ok', distances: [[61_000], [65_000]] })
    const origins = [
      { latitude: 45.1, longitude: 10.2 },
      { latitude: 44.9, longitude: 10.8 },
    ]
    const destination = { latitude: 44.4949, longitude: 11.3426 }

    await expect(
      getMapboxRoutesToDestination(origins, destination),
    ).resolves.toEqual([
      { destinationIndex: 0, distanceMeters: 61_000 },
      { destinationIndex: 1, distanceMeters: 65_000 },
    ])

    const requestUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestUrl).toBeInstanceOf(URL)

    const url = requestUrl as URL
    expect(decodeURIComponent(url.pathname)).toBe(
      '/directions-matrix/v1/mapbox/driving/10.2,45.1;10.8,44.9;11.3426,44.4949',
    )
    expect(url.searchParams.get('sources')).toBe('0;1')
    expect(url.searchParams.get('destinations')).toBe('2')
    expect(url.searchParams.get('annotations')).toBe('distance')
  })

  it('skips null routes without changing later indexes', async () => {
    arrangeMapboxResponse({
      code: 'Ok',
      distances: [[61_000], [null], [72_000]],
    })

    await expect(
      getMapboxRoutesToDestination(
        [
          { latitude: 45.1, longitude: 10.2 },
          { latitude: 45, longitude: 10.5 },
          { latitude: 44.9, longitude: 10.8 },
        ],
        { latitude: 44.4949, longitude: 11.3426 },
      ),
    ).resolves.toEqual([
      { destinationIndex: 0, distanceMeters: 61_000 },
      { destinationIndex: 2, distanceMeters: 72_000 },
    ])
  })

  it('returns early for no origins and validates the request', async () => {
    await expect(
      getMapboxRoutesToDestination([], {
        latitude: 44.4949,
        longitude: 11.3426,
      }),
    ).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()

    await expect(
      getMapboxRoutesToDestination(
        Array.from({ length: 21 }, () => ({ latitude: 45, longitude: 10 })),
        { latitude: 44.4949, longitude: 11.3426 },
      ),
    ).rejects.toThrow('at most 20 route origins')
  })

  it('rejects invalid responses and requires the token', async () => {
    arrangeMapboxResponse({ code: 'Ok', distances: [[-1]] })
    await expect(
      getMapboxRoutesToDestination(
        [{ latitude: 45, longitude: 10 }],
        { latitude: 44.4949, longitude: 11.3426 },
      ),
    ).rejects.toThrow('Mapbox Matrix returned an invalid response.')

    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '')
    await expect(
      getMapboxRoutesToDestination(
        [{ latitude: 45, longitude: 10 }],
        { latitude: 44.4949, longitude: 11.3426 },
      ),
    ).rejects.toThrow('MAPBOX_ACCESS_TOKEN is not configured.')
  })
})
