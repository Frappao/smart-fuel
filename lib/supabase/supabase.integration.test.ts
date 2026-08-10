import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { createSupabaseServerClient } from './server'

loadEnvConfig(process.cwd())

describe.skipIf(process.env.RUN_SUPABASE_INTEGRATION !== '1')(
  'Supabase integration',
  () => {
    test('reads the stations table without modifying it', async () => {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from('stations')
        .select('id, mimit_id')
        .limit(1)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  },
)
