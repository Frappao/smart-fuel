import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { POST } from './route'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_ROUTE_TRIP_INTEGRATION !== '1')(
  'POST /api/trip-stations integration',
  () => {
    test(
      'returns route-ranked stations using the real providers',
      async () => {
        const request = new Request('http://localhost/api/trip-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { latitude: 45.4642, longitude: 9.19 },
            destination: { latitude: 44.4949, longitude: 11.3426 },
            refuelAmount: 50,
            consumptionLitersPer100Km: 6,
            fuelType: 'Benzina',
            isSelf: true,
          }),
        })

        const response = await POST(request)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body.baseRouteDistanceMeters).toBeGreaterThan(0)
        expect(body.results.length).toBeGreaterThan(0)
        expect(body.results.length).toBeLessThanOrEqual(10)
        expect(
          body.results.every(
            (result: {
              detourDistanceMeters: number
              detourFuelLiters: number
              netFuelLiters: number
              station: { fuelPrice: number }
            }) =>
              result.detourDistanceMeters >= 0 &&
              result.detourFuelLiters >= 0 &&
              Number.isFinite(result.netFuelLiters) &&
              result.station.fuelPrice > 0,
          ),
        ).toBe(true)

        const netFuelLiters = body.results.map(
          (result: { netFuelLiters: number }) => result.netFuelLiters,
        )
        expect(netFuelLiters).toEqual(
          [...netFuelLiters].sort((a, b) => b - a),
        )
      },
      30_000,
    )
  },
)
