import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_FUEL_PRICES_CSV_URL, MIMIT_STATIONS_CSV_URL } from './constants'

const HEAD_TIMEOUT_MS = 15_000
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Rifornio/1.0; +https://rifornio.it)',
}

/**
 * Data di pubblicazione (Last-Modified) più recente fra i due CSV MIMIT.
 * Restituisce null se il sito non è raggiungibile o non espone la data.
 */
export async function getMimitFilesLastModified(): Promise<Date | null> {
  try {
    const dates = await Promise.all(
      [MIMIT_STATIONS_CSV_URL, MIMIT_FUEL_PRICES_CSV_URL].map(async (url) => {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
          headers: REQUEST_HEADERS,
          signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
        })
        const header = response.ok ? response.headers.get('last-modified') : null
        const time = header ? Date.parse(header) : Number.NaN

        return Number.isFinite(time) ? time : null
      }),
    )

    if (dates.some((time) => time === null)) {
      return null
    }

    return new Date(Math.max(...(dates as number[])))
  } catch {
    return null
  }
}

/** Inizio dell'ultimo import riuscito (cron Vercel o Mac), o null. */
export async function getLastSuccessfulImportAt(): Promise<Date | null> {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('import_runs')
      .select('started_at')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)

    if (error || !data?.[0]) {
      return null
    }

    return new Date(data[0].started_at)
  } catch {
    return null
  }
}

/** Serve un import se l'ultimo riuscito è precedente alla pubblicazione MIMIT. */
export function isImportNeeded(
  filesLastModified: Date,
  lastSuccessfulImportAt: Date | null,
): boolean {
  return (
    lastSuccessfulImportAt === null ||
    lastSuccessfulImportAt.getTime() < filesLastModified.getTime()
  )
}
