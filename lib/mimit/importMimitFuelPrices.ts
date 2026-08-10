import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_FUEL_PRICES_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { mapFuelPriceToDatabaseRow } from './mapFuelPriceToDatabaseRow'
import { parseFuelPricesCsv } from './parseFuelPricesCsv'

const IMPORT_BATCH_SIZE = 500
const STATIONS_PAGE_SIZE = 1_000

interface StationLookupRow {
  id: number
  mimit_id: number
}

export interface ImportMimitFuelPricesResult {
  totalParsed: number
  totalImported: number
  totalSkipped: number
}

export async function importMimitFuelPrices(): Promise<ImportMimitFuelPricesResult> {
  const importStartedAt = new Date().toISOString()
  const csv = await downloadCsv(MIMIT_FUEL_PRICES_CSV_URL)
  const prices = parseFuelPricesCsv(csv)
  const supabase = createSupabaseServerClient()
  const stations: StationLookupRow[] = []

  for (let offset = 0; ; offset += STATIONS_PAGE_SIZE) {
    const pageNumber = Math.floor(offset / STATIONS_PAGE_SIZE) + 1
    const { data, error } = await supabase
      .from('stations')
      .select('id, mimit_id')
      .range(offset, offset + STATIONS_PAGE_SIZE - 1)

    if (error) {
      throw new Error(
        `MIMIT fuel prices import failed while loading stations page ${pageNumber}: ${error.message}`,
      )
    }

    const page = data ?? []
    stations.push(...page)

    if (page.length < STATIONS_PAGE_SIZE) {
      break
    }
  }

  const stationIdsByMimitId = new Map<number, number>(
    stations.map((station) => [station.mimit_id, station.id]),
  )
  const rows = []
  let totalSkipped = 0

  for (const price of prices) {
    const stationId = stationIdsByMimitId.get(price.mimitId)

    if (stationId === undefined) {
      totalSkipped += 1
      continue
    }

    rows.push(mapFuelPriceToDatabaseRow(price, stationId))
  }

  let totalImported = 0

  for (let offset = 0; offset < rows.length; offset += IMPORT_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + IMPORT_BATCH_SIZE)
    const batchNumber = Math.floor(offset / IMPORT_BATCH_SIZE) + 1
    const { error } = await supabase.from('fuel_prices').upsert(batch, {
      onConflict: 'station_id,fuel_type,is_self',
    })

    if (error) {
      throw new Error(
        `MIMIT fuel prices import failed for batch ${batchNumber}: ${error.message}`,
      )
    }

    totalImported += batch.length
  }

  const { error: cleanupError } = await supabase
    .from('fuel_prices')
    .delete()
    .lt('updated_at', importStartedAt)

  if (cleanupError) {
    throw new Error(
      `MIMIT fuel prices cleanup failed: ${cleanupError.message}`,
    )
  }

  return {
    totalParsed: prices.length,
    totalImported,
    totalSkipped,
  }
}
