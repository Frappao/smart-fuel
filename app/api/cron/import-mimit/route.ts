import { importMimitData } from '../../../../lib/mimit/importMimitData'
import { recordImportRun } from '../../../../lib/mimit/recordImportRun'

// La regione (fra1) è fissata in vercel.json: `preferredRegion` è deprecato
// in Next 16 e su Vercel accetta solo 'auto' | 'global' | 'home'.
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function unauthorizedResponse(): Response {
  return Response.json({ error: 'Unauthorized.' }, { status: 401 })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return Response.json(
      { error: 'Cron import is not configured.' },
      { status: 503 },
    )
  }

  const authorization = request.headers.get('authorization')

  if (authorization !== `Bearer ${cronSecret}`) {
    return unauthorizedResponse()
  }

  const startedAt = new Date()
  console.info(
    `[mimit] import avviato ${startedAt.toISOString()} (regione ${process.env.VERCEL_REGION ?? 'locale'})`,
  )

  try {
    const result = await importMimitData()
    const finishedAt = new Date()

    console.info(
      `[mimit] import completato in ${finishedAt.getTime() - startedAt.getTime()} ms: ` +
        `${result.stations.totalImported} impianti, ${result.fuelPrices.totalImported} prezzi, ` +
        `${result.fuelPrices.totalSkipped} prezzi scartati`,
    )

    await recordImportRun({
      startedAt,
      finishedAt,
      status: 'success',
      stationsImported: result.stations.totalImported,
      fuelPricesImported: result.fuelPrices.totalImported,
      fuelPricesSkipped: result.fuelPrices.totalSkipped,
    })

    return Response.json({
      success: true,
      stations: result.stations,
      fuelPrices: result.fuelPrices,
    })
  } catch (error) {
    console.error('[mimit] import fallito:', error)

    await recordImportRun({
      startedAt,
      finishedAt: new Date(),
      status: 'error',
      errorMessage: errorMessage(error),
    })

    return Response.json(
      { error: 'Unable to import MIMIT data.' },
      { status: 500 },
    )
  }
}
