import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { getNearbyStations } from './getNearbyStations'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== '1')(
  'getNearbyStations integration',
  () => {
    test('returns nearby stations ordered by increasing distance', async () => {
      const stations = await getNearbyStations(45.4642, 9.19, 15_000, 20)

      expect(Array.isArray(stations)).toBe(true)
      expect(stations.length).toBeGreaterThan(0)
      expect(stations.length).toBeLessThanOrEqual(20)

      const distances = stations.map((station) => station.distanceMeters)

      expect(distances.every((distance) => distance >= 0)).toBe(true)
      expect(distances).toEqual([...distances].sort((a, b) => a - b))

      console.log('Primi 3 distributori:', stations.slice(0, 3))
    })
  },
)
