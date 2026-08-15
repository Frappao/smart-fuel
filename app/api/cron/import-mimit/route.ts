import { importMimitData } from '../../../../lib/mimit/importMimitData'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function unauthorizedResponse(): Response {
  return Response.json({ error: 'Unauthorized.' }, { status: 401 })
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

  try {
    const result = await importMimitData()

    return Response.json({
      success: true,
      stations: result.stations,
      fuelPrices: result.fuelPrices,
    })
  } catch {
    return Response.json(
      { error: 'Unable to import MIMIT data.' },
      { status: 500 },
    )
  }
}
