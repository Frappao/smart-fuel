import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNearbyStations } from '../../../lib/stations/getNearbyStations'
import { GET } from './route'

vi.mock('../../../lib/stations/getNearbyStations', () => ({
  getNearbyStations: vi.fn(),
}))

function createRequest(query: string): Request {
  return new Request(`http://localhost/api/nearby-stations?${query}`)
}

describe('GET /api/nearby-stations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('passes valid coordinates, radius, and limit to getNearbyStations', async () => {
    vi.mocked(getNearbyStations).mockResolvedValue([])

    const response = await GET(
      createRequest('lat=45.4642&lng=9.19&radius=5000&limit=8'),
    )

    expect(getNearbyStations).toHaveBeenCalledWith(45.4642, 9.19, 5_000, 8)
    expect(response.status).toBe(200)
  })

  it('uses the default radius and limit when they are absent', async () => {
    vi.mocked(getNearbyStations).mockResolvedValue([])

    await GET(createRequest('lat=45.4642&lng=9.19'))

    expect(getNearbyStations).toHaveBeenCalledWith(
      45.4642,
      9.19,
      15_000,
      20,
    )
  })

  it.each([
    ['latitude', 'lat=91&lng=9.19'],
    ['longitude', 'lat=45.4642&lng=181'],
  ])('returns 400 for an invalid %s', async (_label, query) => {
    const response = await GET(createRequest(query))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: expect.any(String),
    })
    expect(getNearbyStations).not.toHaveBeenCalled()
  })

  it('returns a generic 500 response when getNearbyStations fails', async () => {
    vi.mocked(getNearbyStations).mockRejectedValue(
      new Error('Sensitive database error'),
    )

    const response = await GET(createRequest('lat=45.4642&lng=9.19'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to retrieve nearby stations.',
    })
  })

  it('returns stations as JSON with status 200', async () => {
    const stations = [
      {
        id: 42,
        mimitId: 12_345,
        name: 'Stazione Centro',
        brand: 'Fuel Smart',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        latitude: 45.4642,
        longitude: 9.19,
        distanceMeters: 1_250.5,
        fuelPrice: 1.829,
        communicatedAt: '2026-08-11T08:30:00+00:00',
      },
    ]
    vi.mocked(getNearbyStations).mockResolvedValue(stations)

    const response = await GET(createRequest('lat=45.4642&lng=9.19'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ stations })
  })
})
