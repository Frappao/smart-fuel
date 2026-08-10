import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import {
  MIMIT_FUEL_PRICES_CSV_URL,
  MIMIT_STATIONS_CSV_URL,
} from './constants'
import { downloadCsv } from './downloadCsv'
import { mapFuelPriceToDatabaseRow } from './mapFuelPriceToDatabaseRow'
import { parseFuelPricesCsv } from './parseFuelPricesCsv'
import { parseStationsCsv } from './parseStationsCsv'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== '1')(
  'MIMIT fuel prices sample import',
  () => {
    test(
      'upserts at most ten prices belonging to the first five stations',
      async () => {
        const [stationsCsv, fuelPricesCsv] = await Promise.all([
          downloadCsv(MIMIT_STATIONS_CSV_URL),
          downloadCsv(MIMIT_FUEL_PRICES_CSV_URL),
        ])
        const sampleStations = parseStationsCsv(stationsCsv).slice(0, 5)
        const fuelPrices = parseFuelPricesCsv(fuelPricesCsv)

        expect(sampleStations).toHaveLength(5)

        const mimitIds = sampleStations.map((station) => station.mimitId)
        const mimitIdSet = new Set(mimitIds)
        const supabase = createSupabaseServerClient()
        const { data: stationData, error: stationsError } = await supabase
          .from('stations')
          .select('id, mimit_id')
          .in('mimit_id', mimitIds)

        expect(stationsError).toBeNull()

        const persistedStations = stationData ?? []
        expect(persistedStations).toHaveLength(5)

        const stationIdByMimitId = new Map<number, number>(
          persistedStations.map((station) => [
            Number(station.mimit_id),
            Number(station.id),
          ]),
        )
        const sampleFuelPrices = fuelPrices
          .filter((price) => mimitIdSet.has(price.mimitId))
          .slice(0, 10)
        const databaseRows = sampleFuelPrices.flatMap((price) => {
          const stationId = stationIdByMimitId.get(price.mimitId)

          return stationId === undefined
            ? []
            : [mapFuelPriceToDatabaseRow(price, stationId)]
        })

        console.log(
          'Prezzi trovati per le 5 stazioni:',
          sampleFuelPrices.length,
        )

        if (databaseRows.length === 0) {
          throw new Error('No fuel prices found for the five sample stations.')
        }

        const { error: upsertError } = await supabase
          .from('fuel_prices')
          .upsert(databaseRows, {
            onConflict: 'station_id,fuel_type,is_self',
          })

        expect(upsertError).toBeNull()

        const stationIds = [...stationIdByMimitId.values()]
        const stationIdSet = new Set(stationIds)
        const { data: importedPrices, error: pricesError } = await supabase
          .from('fuel_prices')
          .select('id, station_id')
          .in('station_id', stationIds)

        expect(pricesError).toBeNull()

        const persistedPrices = importedPrices ?? []
        expect(persistedPrices.length).toBeGreaterThan(0)

        for (const price of persistedPrices) {
          expect(stationIdSet.has(Number(price.station_id))).toBe(true)
        }

        console.log('Prezzi importati nel sample:', databaseRows.length)
      },
      120_000,
    )
  },
)
