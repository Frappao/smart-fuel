import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_STATIONS_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { mapStationToDatabaseRow } from './mapStationToDatabaseRow'
import { parseStationsCsv } from './parseStationsCsv'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== '1')(
  'MIMIT stations sample import',
  () => {
    test(
      'upserts and reads back only the first five official stations',
      async () => {
        const csv = await downloadCsv(MIMIT_STATIONS_CSV_URL)
        const sample = parseStationsCsv(csv).slice(0, 5)

        expect(sample).toHaveLength(5)

        const databaseRows = sample.map(mapStationToDatabaseRow)
        const mimitIds = sample.map((station) => station.mimitId)
        const supabase = createSupabaseServerClient()

        const { error: upsertError } = await supabase
          .from('stations')
          .upsert(databaseRows, { onConflict: 'mimit_id' })

        expect(upsertError).toBeNull()

        const { data, error: selectError } = await supabase
          .from('stations')
          .select('id, mimit_id')
          .in('mimit_id', mimitIds)

        expect(selectError).toBeNull()
        expect(data).toHaveLength(5)
      },
      120_000,
    )
  },
)
