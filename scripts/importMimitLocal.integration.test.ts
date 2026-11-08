import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'vitest'

import { importMimitData } from '../lib/mimit/importMimitData'
import {
  getLastSuccessfulImportAt,
  getMimitFilesLastModified,
  isImportNeeded,
} from '../lib/mimit/localImportSchedule'
import { recordImportRun } from '../lib/mimit/recordImportRun'

// Import MIMIT eseguito dal Mac (IP italiano): il sito MIMIT non accetta
// connessioni dai datacenter cloud (Vercel/AWS, GitHub/Azure).
// Lanciato da launchd ogni 30 minuti e all'avvio (scripts/install-mimit-launchd.sh):
// importa solo se MIMIT ha pubblicato file più recenti dell'ultimo import
// riuscito. FORCE_MIMIT_IMPORT=1 salta il controllo.
// Usa Vitest come runner perché i moduli importano 'server-only'.
// Scrive sul database configurato in .env.local.

describe.skipIf(process.env.RUN_LOCAL_MIMIT_IMPORT !== '1')(
  'local scheduled MIMIT import',
  () => {
    test(
      'imports MIMIT data and records the run',
      async () => {
        // @next/env in modalità test ignora .env.local: lo carichiamo
        // direttamente (le variabili già presenti non vengono sovrascritte).
        const envFile = join(process.cwd(), '.env.local')

        if (existsSync(envFile)) {
          process.loadEnvFile(envFile)
        }

        if (process.env.FORCE_MIMIT_IMPORT !== '1') {
          const filesLastModified = await getMimitFilesLastModified()

          if (!filesLastModified) {
            console.info(
              '[mimit] sito MIMIT non raggiungibile (Mac offline?): riprovo al prossimo giro',
            )
            return
          }

          const lastSuccessfulImportAt = await getLastSuccessfulImportAt()

          if (!isImportNeeded(filesLastModified, lastSuccessfulImportAt)) {
            console.info(
              `[mimit] niente da fare: file MIMIT del ${filesLastModified.toISOString()} ` +
                `già importato il ${lastSuccessfulImportAt?.toISOString()}`,
            )
            return
          }

          console.info(
            `[mimit] nuovi file MIMIT del ${filesLastModified.toISOString()} ` +
              `(ultimo import riuscito: ${lastSuccessfulImportAt?.toISOString() ?? 'nessuno'})`,
          )
        }

        const startedAt = new Date()
        console.info(`[mimit] import locale avviato ${startedAt.toISOString()}`)

        try {
          const result = await importMimitData()
          const finishedAt = new Date()

          console.info(
            `[mimit] import locale completato in ${finishedAt.getTime() - startedAt.getTime()} ms: ` +
              `${result.stations.totalImported} impianti, ${result.fuelPrices.totalImported} prezzi, ` +
              `${result.fuelPrices.totalSkipped} scartati`,
          )

          await recordImportRun({
            source: 'mimit-mac',
            startedAt,
            finishedAt,
            status: 'success',
            stationsImported: result.stations.totalImported,
            fuelPricesImported: result.fuelPrices.totalImported,
            fuelPricesSkipped: result.fuelPrices.totalSkipped,
          })
        } catch (error) {
          console.error('[mimit] import locale fallito:', error)

          await recordImportRun({
            source: 'mimit-mac',
            startedAt,
            finishedAt: new Date(),
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error),
          })

          throw error
        }
      },
      300_000,
    )
  },
)
