import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { getStationsAlongRoute } from './getStationsAlongRoute'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== '1')(
  'getStationsAlongRoute integration',
  () => {
    test('returns priced stations from a route corridor without modifying data', async () => {
      const corridorMeters = 15_000
      const stations = await getStationsAlongRoute(
        {
          type: 'LineString',
          coordinates: [
            [9.1, 45.4],
            [9.3, 45.55],
          ],
        },
        corridorMeters,
        20,
        'Benzina',
        true,
      )

      expect(stations.length).toBeGreaterThan(0)
      expect(stations.length).toBeLessThanOrEqual(20)
      expect(
        stations.every(
          (station) =>
            station.distanceMeters >= 0 &&
            station.distanceMeters <= corridorMeters &&
            typeof station.fuelPrice === 'number' &&
            station.fuelPrice > 0,
        ),
      ).toBe(true)

      const prices = stations.flatMap((station) =>
        typeof station.fuelPrice === 'number' ? [station.fuelPrice] : [],
      )
      expect(prices).toEqual([...prices].sort((a, b) => a - b))
    })
  },
)
