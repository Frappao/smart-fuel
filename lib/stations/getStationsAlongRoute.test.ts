import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { getStationsAlongRoute } from './getStationsAlongRoute'

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

const route = {
  type: 'LineString' as const,
  coordinates: [
    [9.19, 45.4642] as [number, number],
    [11.3426, 44.4949] as [number, number],
  ],
}

describe('getStationsAlongRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls the corridor RPC and maps its rows', async () => {
    const rpc = arrangeSupabaseClient({
      data: [
        {
          id: 42,
          mimit_id: 12_345,
          name: 'Stazione percorso',
          brand: 'Brand',
          address: 'Via Emilia 1',
          city: 'Parma',
          province: 'PR',
          latitude: 44.8015,
          longitude: 10.3279,
          distance_meters: 320.5,
          fuel_price: 1.729,
          communicated_at: '2026-09-30T08:30:00+00:00',
        },
      ],
      error: null,
    })

    await expect(
      getStationsAlongRoute(route, 2_500, 15, 'Gasolio', false),
    ).resolves.toEqual([
      {
        id: 42,
        mimitId: 12_345,
        name: 'Stazione percorso',
        brand: 'Brand',
        address: 'Via Emilia 1',
        city: 'Parma',
        province: 'PR',
        latitude: 44.8015,
        longitude: 10.3279,
        distanceMeters: 320.5,
        fuelPrice: 1.729,
        communicatedAt: '2026-09-30T08:30:00+00:00',
      },
    ])
    expect(rpc).toHaveBeenCalledWith('stations_along_route', {
      route_geojson: JSON.stringify(route),
      corridor_meters: 2_500,
      result_limit: 15,
      requested_fuel_type: 'Gasolio',
      requested_is_self: false,
    })
  })

  it('uses conservative defaults and surfaces database errors', async () => {
    const rpc = arrangeSupabaseClient({ data: [], error: null })

    await getStationsAlongRoute(route)
    expect(rpc).toHaveBeenCalledWith(
      'stations_along_route',
      expect.objectContaining({
        corridor_meters: 2_000,
        result_limit: 20,
        requested_fuel_type: 'Benzina',
        requested_is_self: true,
      }),
    )

    arrangeSupabaseClient({
      data: null,
      error: { message: 'database unavailable' },
    })
    await expect(getStationsAlongRoute(route)).rejects.toThrow(
      'Stations along route lookup failed: database unavailable',
    )
  })
})
