import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxRouteViaWaypoint } from './getMapboxRouteViaWaypoint'

const TEST_ACCESS_TOKEN = 'test-mapbox-access-token'
const fetchMock = vi.fn()
const origin = { latitude: 45.625, longitude: 9.035 }
const waypoint = { latitude: 44.8015, longitude: 10.3279 }
const destination = { latitude: 41.9028, longitude: 12.4964 }

function arrangeMapboxResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('getMapboxRouteViaWaypoint', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', TEST_ACCESS_TOKEN)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns both legs of a route through the waypoint', async () => {
    arrangeMapboxResponse({
      code: 'Ok',
      routes: [{ legs: [{ distance: 150_000 }, { distance: 455_000 }] }],
    })

    await expect(
      getMapboxRouteViaWaypoint(origin, waypoint, destination),
    ).resolves.toEqual({
      originToWaypointDistanceMeters: 150_000,
      waypointToDestinationDistanceMeters: 455_000,
    })

    const requestUrl = fetchMock.mock.calls[0]?.[0] as URL
    expect(decodeURIComponent(requestUrl.pathname)).toBe(
      '/directions/v5/mapbox/driving/9.035,45.625;10.3279,44.8015;12.4964,41.9028',
    )
    expect(requestUrl.searchParams.get('overview')).toBe('false')
    expect(requestUrl.searchParams.get('steps')).toBe('false')
  })

  it('rejects invalid coordinates, responses, and HTTP errors', async () => {
    await expect(
      getMapboxRouteViaWaypoint(
        { latitude: 91, longitude: 9.035 },
        waypoint,
        destination,
      ),
    ).rejects.toThrow('valid coordinates')
    expect(fetchMock).not.toHaveBeenCalled()

    arrangeMapboxResponse({
      code: 'Ok',
      routes: [{ legs: [{ distance: 150_000 }] }],
    })
    await expect(
      getMapboxRouteViaWaypoint(origin, waypoint, destination),
    ).rejects.toThrow('invalid response')

    arrangeMapboxResponse({ message: 'Too Many Requests' }, false, 429)
    await expect(
      getMapboxRouteViaWaypoint(origin, waypoint, destination),
    ).rejects.toThrow('HTTP status 429')
  })

  it('requires a server-side access token', async () => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '')

    await expect(
      getMapboxRouteViaWaypoint(origin, waypoint, destination),
    ).rejects.toThrow('MAPBOX_ACCESS_TOKEN is not configured.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
