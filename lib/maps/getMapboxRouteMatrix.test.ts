import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxRouteMatrix } from './getMapboxRouteMatrix'

const TEST_ACCESS_TOKEN = 'test-mapbox-access-token'
const fetchMock = vi.fn()

function arrangeMapboxResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('getMapboxRouteMatrix', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', TEST_ACCESS_TOKEN)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns an empty array without calling fetch for no destinations', async () => {
    await expect(
      getMapboxRouteMatrix({ latitude: 45.4642, longitude: 9.19 }, []),
    ).resolves.toEqual([])

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('builds a driving 1-to-N request and preserves destination order', async () => {
    arrangeMapboxResponse({ code: 'Ok', distances: [[4_350, 8_120.5]] })

    const origin = { latitude: 45.4642, longitude: 9.19 }
    const destinations = [
      { latitude: 45.47, longitude: 9.18 },
      { latitude: 45.45, longitude: 9.21 },
    ]

    await expect(
      getMapboxRouteMatrix(origin, destinations),
    ).resolves.toEqual([
      { destinationIndex: 0, distanceMeters: 4_350 },
      { destinationIndex: 1, distanceMeters: 8_120.5 },
    ])

    expect(fetchMock).toHaveBeenCalledOnce()

    const requestUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestUrl).toBeInstanceOf(URL)

    const url = requestUrl as URL
    expect(decodeURIComponent(url.pathname)).toBe(
      '/directions-matrix/v1/mapbox/driving/9.19,45.4642;9.18,45.47;9.21,45.45',
    )
    expect(url.searchParams.get('sources')).toBe('0')
    expect(url.searchParams.get('destinations')).toBe('1;2')
    expect(url.searchParams.get('annotations')).toBe('distance')
    expect(url.searchParams.get('access_token')).toBe(TEST_ACCESS_TOKEN)
  })

  it('skips a missing route without changing later destination indexes', async () => {
    arrangeMapboxResponse({
      code: 'Ok',
      distances: [[1_250, null, 3_750]],
    })

    await expect(
      getMapboxRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [
          { latitude: 45.47, longitude: 9.18 },
          { latitude: 45.45, longitude: 9.21 },
          { latitude: 45.49, longitude: 9.23 },
        ],
      ),
    ).resolves.toEqual([
      { destinationIndex: 0, distanceMeters: 1_250 },
      { destinationIndex: 2, distanceMeters: 3_750 },
    ])
  })

  it('rejects an invalid response payload', async () => {
    arrangeMapboxResponse({ code: 'Ok', distances: [['invalid']] })

    await expect(
      getMapboxRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [{ latitude: 45.47, longitude: 9.18 }],
      ),
    ).rejects.toThrow('Mapbox Matrix returned an invalid response.')
  })

  it('throws an HTTP error without exposing the access token', async () => {
    arrangeMapboxResponse({ message: 'Too Many Requests' }, false, 429)

    let caughtError: unknown

    try {
      await getMapboxRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [{ latitude: 45.47, longitude: 9.18 }],
      )
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(Error)

    if (caughtError instanceof Error) {
      expect(caughtError.message).toContain('HTTP status 429')
      expect(caughtError.message).not.toContain(TEST_ACCESS_TOKEN)
    }
  })

  it('throws a clear error when the access token is missing', async () => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '')

    await expect(
      getMapboxRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        [{ latitude: 45.47, longitude: 9.18 }],
      ),
    ).rejects.toThrow('MAPBOX_ACCESS_TOKEN is not configured.')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects more than 20 destinations without calling fetch', async () => {
    const destinations = Array.from({ length: 21 }, (_, index) => ({
      latitude: 45 + index / 100,
      longitude: 9,
    }))

    await expect(
      getMapboxRouteMatrix(
        { latitude: 45.4642, longitude: 9.19 },
        destinations,
      ),
    ).rejects.toThrow('Mapbox Matrix supports at most 20 destinations.')

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
