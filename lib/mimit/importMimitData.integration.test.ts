import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { importMimitData } from './importMimitData'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_FULL_MIMIT_IMPORT !== '1')(
  'full MIMIT import integration',
  () => {
    test(
      'imports the complete official datasets into Supabase',
      async () => {
        const startedAt = Date.now()
        const result = await importMimitData()
        const durationSeconds = (Date.now() - startedAt) / 1_000

        expect(result.stations.totalParsed).toBeGreaterThan(1_000)
        expect(result.stations.totalImported).toBeGreaterThan(1_000)
        expect(result.fuelPrices.totalParsed).toBeGreaterThan(1_000)
        expect(result.fuelPrices.totalImported).toBeGreaterThan(1_000)

        console.log('Risultato stations:', result.stations)
        console.log('Risultato fuelPrices:', result.fuelPrices)
        console.log('Durata totale in secondi:', durationSeconds)
      },
      300_000,
    )
  },
)
