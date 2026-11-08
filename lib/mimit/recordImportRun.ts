import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'

export interface ImportRunRecord {
  startedAt: Date
  finishedAt: Date
  status: 'success' | 'error'
  stationsImported?: number | null
  fuelPricesImported?: number | null
  fuelPricesSkipped?: number | null
  errorMessage?: string | null
}

const MAX_ERROR_MESSAGE_LENGTH = 2_000

/**
 * Salva l'esito di un import in public.import_runs.
 * Non lancia mai: un problema di logging non deve cambiare l'esito del cron.
 */
export async function recordImportRun(run: ImportRunRecord): Promise<void> {
  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('import_runs').insert({
      source: 'mimit',
      started_at: run.startedAt.toISOString(),
      finished_at: run.finishedAt.toISOString(),
      duration_ms: run.finishedAt.getTime() - run.startedAt.getTime(),
      status: run.status,
      stations_imported: run.stationsImported ?? null,
      fuel_prices_imported: run.fuelPricesImported ?? null,
      fuel_prices_skipped: run.fuelPricesSkipped ?? null,
      error_message: run.errorMessage
        ? run.errorMessage.slice(0, MAX_ERROR_MESSAGE_LENGTH)
        : null,
    })

    if (error) {
      console.error('[mimit] impossibile salvare import_runs:', error.message)
    }
  } catch (error) {
    console.error('[mimit] impossibile salvare import_runs:', error)
  }
}
