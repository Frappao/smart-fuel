import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { getNearbyStations } from './getNearbyStations'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

interface MockRpcResponse {
  data: unknown
  error: { message: string } | null
}

function arrangeSupabaseClient(response: MockRpcResponse) {
  const rpc = vi.fn().mockResolvedValue(response)

  vi.mocked(createSupabaseServerClient).mockReturnValue({
    rpc,
  } as unknown as ReturnType<typeof createSupabaseServerClient>)

  return rpc
}

describe('getNearbyStations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls nearby_stations with the requested parameters and maps its rows', async () => {
    const rpc = arrangeSupabaseClient({
      data: [
        {
          id: 42,
          mimit_id: 12_345,
          name: 'Stazione Centro',
          brand: 'Fuel Smart',
          address: 'Via Roma 1',
          city: 'Milano',
          province: 'MI',
          latitude: 45.4642,
          longitude: 9.19,
          distance_meters: 1_250.5,
          fuel_price: 1.829,
          communicated_at: '2026-08-11T08:30:00+00:00',
        },
        {
          id: 43,
          mimit_id: 12_346,
          name: null,
          brand: 'Senza prezzo',
          address: null,
          city: 'Milano',
          province: 'MI',
          latitude: 45.465,
          longitude: 9.191,
          distance_meters: 1_500,
          fuel_price: null,
          communicated_at: null,
        },
      ],
      error: null,
    })

    await expect(
      getNearbyStations(45.4642, 9.19, 5_000, 8, 'Gasolio'),
    ).resolves.toEqual([
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
      {
        id: 43,
        mimitId: 12_346,
        name: null,
        brand: 'Senza prezzo',
        address: null,
        city: 'Milano',
        province: 'MI',
        latitude: 45.465,
        longitude: 9.191,
        distanceMeters: 1_500,
        fuelPrice: null,
        communicatedAt: null,
      },
    ])

    expect(rpc).toHaveBeenCalledWith('nearby_stations', {
      user_lat: 45.4642,
      user_lng: 9.19,
      radius_meters: 5_000,
      result_limit: 8,
      requested_fuel_type: 'Gasolio',
    })
  })

  it('uses the default radius, result limit, and fuel type', async () => {
    const rpc = arrangeSupabaseClient({ data: [], error: null })

    await getNearbyStations(41.9028, 12.4964)

    expect(rpc).toHaveBeenCalledWith('nearby_stations', {
      user_lat: 41.9028,
      user_lng: 12.4964,
      radius_meters: 15_000,
      result_limit: 20,
      requested_fuel_type: 'Benzina',
    })
  })

  it('passes GPL as the requested fuel type', async () => {
    const rpc = arrangeSupabaseClient({ data: [], error: null })

    await getNearbyStations(45.4642, 9.19, 15_000, 20, 'GPL')

    expect(rpc).toHaveBeenCalledWith('nearby_stations', {
      user_lat: 45.4642,
      user_lng: 9.19,
      radius_meters: 15_000,
      result_limit: 20,
      requested_fuel_type: 'GPL',
    })
  })

  it('throws a clear Error when Supabase returns an error', async () => {
    arrangeSupabaseClient({
      data: null,
      error: { message: 'database unavailable' },
    })

    await expect(getNearbyStations(45.4642, 9.19)).rejects.toThrow(
      'Nearby stations lookup failed: database unavailable',
    )
  })
})
