import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { geocodeAddress } from './geocodeAddress'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_ROUTE_TRIP_INTEGRATION !== '1')(
  'geocodeAddress integration',
  () => {
    test('returns Italian coordinates from the real Mapbox API', async () => {
      const results = await geocodeAddress('Piazza del Duomo, Milano')

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(5)
      expect(
        results.every(
          ({ id, label, latitude, longitude }) =>
            id.length > 0 &&
            label.length > 0 &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180,
        ),
      ).toBe(true)
    })
  },
)
