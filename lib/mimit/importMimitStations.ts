import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_STATIONS_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { mapStationToDatabaseRow } from './mapStationToDatabaseRow'
import { parseStationsCsv } from './parseStationsCsv'

const IMPORT_BATCH_SIZE = 500

export interface ImportMimitStationsResult {
  totalParsed: number
  totalImported: number
}

export async function importMimitStations(): Promise<ImportMimitStationsResult> {
  const importStartedAt = new Date().toISOString()
  const csv = await downloadCsv(MIMIT_STATIONS_CSV_URL)
  const stations = parseStationsCsv(csv)
  const rows = stations.map(mapStationToDatabaseRow)
  const supabase = createSupabaseServerClient()

  let totalImported = 0

  for (let offset = 0; offset < rows.length; offset += IMPORT_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + IMPORT_BATCH_SIZE)
    const batchNumber = Math.floor(offset / IMPORT_BATCH_SIZE) + 1
    const { error } = await supabase
      .from('stations')
      .upsert(batch, { onConflict: 'mimit_id' })

    if (error) {
      throw new Error(
        `MIMIT stations import failed for batch ${batchNumber}: ${error.message}`,
      )
    }

    totalImported += batch.length
  }

  const { error: cleanupError } = await supabase
    .from('stations')
    .delete()
    .lt('updated_at', importStartedAt)

  if (cleanupError) {
    throw new Error(
      `MIMIT stations cleanup failed: ${cleanupError.message}`,
    )
  }

  return {
    totalParsed: stations.length,
    totalImported,
  }
}
