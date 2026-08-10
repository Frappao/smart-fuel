import { describe, expect, test } from 'vitest'

import {
  MIMIT_FUEL_PRICES_CSV_URL,
  MIMIT_STATIONS_CSV_URL,
} from './constants'
import { downloadCsv } from './downloadCsv'
import { parseFuelPricesCsv } from './parseFuelPricesCsv'
import { parseStationsCsv } from './parseStationsCsv'

describe.skipIf(process.env.RUN_MIMIT_INTEGRATION !== '1')(
  'MIMIT live integration',
  () => {
    test(
      'downloads and parses the official station and price datasets',
      async () => {
        const stationsCsv = await downloadCsv(MIMIT_STATIONS_CSV_URL)
        const stations = parseStationsCsv(stationsCsv)

        expect(stations.length).toBeGreaterThan(1_000)
        expect(typeof stations[0]?.mimitId).toBe('number')

        const fuelPricesCsv = await downloadCsv(MIMIT_FUEL_PRICES_CSV_URL)
        const fuelPrices = parseFuelPricesCsv(fuelPricesCsv)

        expect(fuelPrices.length).toBeGreaterThan(1_000)
        expect(typeof fuelPrices[0]?.mimitId).toBe('number')
        expect(fuelPrices[0]?.price).toBeGreaterThan(0)

        console.log('Numero distributori:', stations.length)
        console.log('Numero prezzi:', fuelPrices.length)
        console.log('Primo distributore:', stations[0])
        console.log('Primo prezzo:', fuelPrices[0])
      },
      120_000,
    )
  },
)
