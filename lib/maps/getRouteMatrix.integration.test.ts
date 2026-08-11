import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { getRouteMatrix } from './getRouteMatrix'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_GOOGLE_ROUTES_INTEGRATION !== '1')(
  'getRouteMatrix integration',
  () => {
    test(
      'returns driving routes for two destinations',
      async () => {
        const results = await getRouteMatrix(
          { latitude: 45.4642, longitude: 9.19 },
          [
            { latitude: 45.47, longitude: 9.18 },
            { latitude: 45.45, longitude: 9.21 },
          ],
        )

        expect(Array.isArray(results)).toBe(true)
        expect(results).toHaveLength(2)
        expect(results.every((result) => result.distanceMeters > 0)).toBe(true)
        expect(results.every((result) => result.durationSeconds > 0)).toBe(true)
        expect(results.map((result) => result.destinationIndex)).toEqual([0, 1])

        for (const result of results) {
          console.log({
            destinationIndex: result.destinationIndex,
            distanceMeters: result.distanceMeters,
            durationSeconds: result.durationSeconds,
          })
        }
      },
      30_000,
    )
  },
)
