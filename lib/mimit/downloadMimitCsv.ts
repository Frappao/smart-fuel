import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_FUEL_PRICES_CSV_URL, MIMIT_STATIONS_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'

export type MimitDataset = 'stations' | 'fuel_prices'

const DATASET_URLS: Record<MimitDataset, string> = {
  stations: MIMIT_STATIONS_CSV_URL,
  fuel_prices: MIMIT_FUEL_PRICES_CSV_URL,
}

const RELAY_ATTEMPTS = 3
const RELAY_RETRY_DELAYS_MS = [2_000, 5_000]

export interface DownloadMimitCsvOptions {
  relayRetryDelaysMs?: number[]
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Scarica il CSV facendolo prelevare dal database Supabase
 * (public.fetch_mimit_csv): MIMIT rifiuta le connessioni dalle funzioni
 * Vercel ma risponde al server del database.
 */
async function downloadCsvViaDatabaseOnce(dataset: MimitDataset): Promise<string> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.rpc('fetch_mimit_csv', { dataset })

  if (error) {
    throw new Error(`fetch_mimit_csv failed: ${error.message}`)
  }

  if (typeof data !== 'string' || data.trim() === '') {
    throw new Error('fetch_mimit_csv returned an empty response')
  }

  if (data.trimStart().startsWith('<')) {
    throw new Error('fetch_mimit_csv received HTML instead of CSV')
  }

  return data
}

async function downloadCsvViaDatabase(
  dataset: MimitDataset,
  retryDelaysMs: number[],
): Promise<string> {
  let lastError: unknown

  for (let attempt = 1; attempt <= RELAY_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now()

    try {
      const text = await downloadCsvViaDatabaseOnce(dataset)

      console.info(
        `[mimit] download via database ok ${dataset} (tentativo ${attempt}/${RELAY_ATTEMPTS}, ${Date.now() - startedAt} ms, ${text.length} caratteri)`,
      )

      return text
    } catch (error) {
      lastError = error
      const willRetry = attempt < RELAY_ATTEMPTS
      const delayMs =
        retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)] ?? 0

      console.warn(
        `[mimit] download via database fallito ${dataset} (tentativo ${attempt}/${RELAY_ATTEMPTS}, ${Date.now() - startedAt} ms): ${errorMessage(error)}` +
          (willRetry ? ` — nuovo tentativo tra ${delayMs} ms` : ''),
      )

      if (willRetry && delayMs > 0) {
        await wait(delayMs)
      }
    }
  }

  throw lastError
}

/**
 * Scarica un CSV MIMIT: prima direttamente (funziona dal Mac), poi tramite il
 * database Supabase (funziona dal cron Vercel, che MIMIT non lascia passare).
 * Un solo tentativo diretto: da Vercel fallisce sempre e ogni tentativo costa
 * ~10 secondi di timeout di connessione.
 */
export async function downloadMimitCsv(
  dataset: MimitDataset,
  options: DownloadMimitCsvOptions = {},
): Promise<string> {
  let directError: unknown

  try {
    return await downloadCsv(DATASET_URLS[dataset], { attempts: 1 })
  } catch (error) {
    directError = error
  }

  try {
    return await downloadCsvViaDatabase(
      dataset,
      options.relayRetryDelaysMs ?? RELAY_RETRY_DELAYS_MS,
    )
  } catch (relayError) {
    throw new Error(
      `MIMIT ${dataset} download failed. Direct: ${errorMessage(directError)}. ` +
        `Via database: ${errorMessage(relayError)}`,
      { cause: relayError },
    )
  }
}
