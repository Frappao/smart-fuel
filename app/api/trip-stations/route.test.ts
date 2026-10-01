import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'
import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'
import { getMapboxRouteViaWaypoint } from '../../../lib/maps/getMapboxRouteViaWaypoint'
import { getMapboxRoutesToDestination } from '../../../lib/maps/getMapboxRoutesToDestination'
import { getStationsAlongRoute } from '../../../lib/stations/getStationsAlongRoute'
import { POST } from './route'

vi.mock('../../../lib/maps/getMapboxDirections', () => ({
  getMapboxDirections: vi.fn(),
}))
vi.mock('../../../lib/maps/getMapboxRouteMatrix', () => ({
  getMapboxRouteMatrix: vi.fn(),
}))
vi.mock('../../../lib/maps/getMapboxRouteViaWaypoint', () => ({
  getMapboxRouteViaWaypoint: vi.fn(),
}))
vi.mock('../../../lib/maps/getMapboxRoutesToDestination', () => ({
  getMapboxRoutesToDestination: vi.fn(),
}))
vi.mock('../../../lib/stations/getStationsAlongRoute', () => ({
  getStationsAlongRoute: vi.fn(),
}))

const origin = { latitude: 45.4642, longitude: 9.19 }
const destination = { latitude: 44.4949, longitude: 11.3426 }
const requestBody = {
  origin,
  destination,
  refuelAmount: 50,
  consumptionLitersPer100Km: 6,
  fuelType: 'Benzina',
  isSelf: true,
}
const geometry = {
  type: 'LineString' as const,
  coordinates: [
    [9.19, 45.4642] as [number, number],
    [11.3426, 44.4949] as [number, number],
  ],
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/trip-stations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function station(id: number, fuelPrice: number) {
  return {
    id,
    mimitId: id + 100,
    name: `Station ${id}`,
    brand: null,
    address: null,
    city: 'Parma',
    province: 'PR',
    latitude: 44.8 + id / 100,
    longitude: 10.3 + id / 100,
    distanceMeters: id * 100,
    fuelPrice,
    communicatedAt: null,
  }
}

describe('POST /api/trip-stations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getMapboxDirections).mockResolvedValue({
      distanceMeters: 100_000,
      geometry,
    })
    vi.mocked(getMapboxRouteViaWaypoint).mockResolvedValue({
      originToWaypointDistanceMeters: 45_000,
      waypointToDestinationDistanceMeters: 65_000,
    })
  })

  it('ranks valid corridor stations by their road detour', async () => {
    const stations = [station(1, 1.8), station(2, 1.75)]
    vi.mocked(getStationsAlongRoute).mockResolvedValue(stations)
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 40_000 },
      { destinationIndex: 1, distanceMeters: 45_000 },
    ])
    vi.mocked(getMapboxRoutesToDestination).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 61_000 },
      { destinationIndex: 1, distanceMeters: 65_000 },
    ])

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(getMapboxDirections).toHaveBeenCalledWith(origin, destination)
    expect(getStationsAlongRoute).toHaveBeenCalledWith(
      geometry,
      2_000,
      20,
      'Benzina',
      true,
    )
    expect(getMapboxRouteMatrix).toHaveBeenCalledWith(
      origin,
      stations.map(({ latitude, longitude }) => ({ latitude, longitude })),
    )
    expect(getMapboxRoutesToDestination).toHaveBeenCalledWith(
      stations.map(({ latitude, longitude }) => ({ latitude, longitude })),
      destination,
    )
    expect(getMapboxRouteViaWaypoint).toHaveBeenCalledWith(
      origin,
      {
        latitude: stations[1].latitude,
        longitude: stations[1].longitude,
      },
      destination,
    )
    expect(responseBody.baseRouteDistanceMeters).toBe(100_000)
    expect(
      responseBody.results.map(
        (result: { station: { id: number } }) => result.station.id,
      ),
    ).toEqual([2, 1])
    expect(responseBody.results[0]).toMatchObject({
      detourDistanceMeters: 10_000,
      detourFuelLiters: 0.6,
    })
  })

  it('excludes a candidate when either road leg is missing', async () => {
    vi.mocked(getStationsAlongRoute).mockResolvedValue([
      station(1, 1.8),
      station(2, 1.7),
    ])
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 40_000 },
      { destinationIndex: 1, distanceMeters: 45_000 },
    ])
    vi.mocked(getMapboxRoutesToDestination).mockResolvedValue([
      { destinationIndex: 1, distanceMeters: 60_000 },
    ])

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(responseBody.results).toHaveLength(1)
    expect(responseBody.results[0].station.id).toBe(2)
  })

  it('returns the base distance without matrix calls when no station is found', async () => {
    vi.mocked(getStationsAlongRoute).mockResolvedValue([])

    const response = await POST(createRequest(requestBody))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      baseRouteDistanceMeters: 100_000,
      results: [],
    })
    expect(getMapboxRouteMatrix).not.toHaveBeenCalled()
    expect(getMapboxRoutesToDestination).not.toHaveBeenCalled()
    expect(getMapboxRouteViaWaypoint).not.toHaveBeenCalled()
  })

  it('corrects a preliminary Matrix winner using routes through each contender', async () => {
    const stations = [station(1, 1.889), station(2, 1.829)]
    vi.mocked(getMapboxDirections).mockResolvedValue({
      distanceMeters: 600_000,
      geometry,
    })
    vi.mocked(getStationsAlongRoute).mockResolvedValue(stations)
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 300_000 },
      { destinationIndex: 1, distanceMeters: 310_000 },
    ])
    vi.mocked(getMapboxRoutesToDestination).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 300_400 },
      { destinationIndex: 1, distanceMeters: 315_500 },
    ])
    vi.mocked(getMapboxRouteViaWaypoint).mockImplementation(
      async (_origin, waypoint) =>
        waypoint.latitude === stations[0].latitude
          ? {
              originToWaypointDistanceMeters: 300_000,
              waypointToDestinationDistanceMeters: 300_350,
            }
          : {
              originToWaypointDistanceMeters: 303_000,
              waypointToDestinationDistanceMeters: 303_470,
            },
    )

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(
      responseBody.results.map(
        (result: { station: { id: number } }) => result.station.id,
      ),
    ).toEqual([2, 1])
    expect(getMapboxRouteViaWaypoint).toHaveBeenCalledTimes(2)
  })

  it('keeps Matrix results when the winner verification is unavailable', async () => {
    const stations = [station(1, 1.8), station(2, 1.75)]
    vi.mocked(getStationsAlongRoute).mockResolvedValue(stations)
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 40_000 },
      { destinationIndex: 1, distanceMeters: 45_000 },
    ])
    vi.mocked(getMapboxRoutesToDestination).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 61_000 },
      { destinationIndex: 1, distanceMeters: 65_000 },
    ])
    vi.mocked(getMapboxRouteViaWaypoint).mockRejectedValue(
      new Error('temporary Directions failure'),
    )

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(
      responseBody.results.map(
        (result: { station: { id: number } }) => result.station.id,
      ),
    ).toEqual([2, 1])
  })

  it('keeps a contender Matrix route when its verification fails', async () => {
    const stations = [station(1, 1.889), station(2, 1.829)]
    vi.mocked(getMapboxDirections).mockResolvedValue({
      distanceMeters: 600_000,
      geometry,
    })
    vi.mocked(getStationsAlongRoute).mockResolvedValue(stations)
    vi.mocked(getMapboxRouteMatrix).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 300_000 },
      { destinationIndex: 1, distanceMeters: 310_000 },
    ])
    vi.mocked(getMapboxRoutesToDestination).mockResolvedValue([
      { destinationIndex: 0, distanceMeters: 300_400 },
      { destinationIndex: 1, distanceMeters: 315_500 },
    ])
    vi.mocked(getMapboxRouteViaWaypoint).mockImplementation(
      async (_origin, waypoint) => {
        if (waypoint.latitude === stations[1].latitude) {
          throw new Error('temporary contender failure')
        }

        return {
          originToWaypointDistanceMeters: 300_000,
          waypointToDestinationDistanceMeters: 300_350,
        }
      },
    )

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(responseBody.results).toHaveLength(2)
    expect(responseBody.results[0].station.id).toBe(1)
  })

  it.each([
    ['origin', { ...requestBody, origin: { latitude: 91, longitude: 9 } }],
    ['destination', { ...requestBody, destination: null }],
    ['amount', { ...requestBody, refuelAmount: 0 }],
    ['consumption', { ...requestBody, consumptionLitersPer100Km: -1 }],
    ['fuel type', { ...requestBody, fuelType: 'Diesel' }],
    ['service mode', { ...requestBody, isSelf: 'true' }],
  ])('rejects invalid %s input', async (_label, body) => {
    const response = await POST(createRequest(body))

    expect(response.status).toBe(400)
    expect(getMapboxDirections).not.toHaveBeenCalled()
  })

  it('returns a generic error without leaking provider or database details', async () => {
    vi.mocked(getMapboxDirections).mockRejectedValue(
      new Error('MAPBOX_ACCESS_TOKEN=sensitive'),
    )

    const response = await POST(createRequest(requestBody))
    const responseBody = await response.json()

    expect(response.status).toBe(502)
    expect(responseBody).toEqual({
      error: 'Unable to find stations along this route.',
    })
    expect(JSON.stringify(responseBody)).not.toContain('sensitive')
  })
})
