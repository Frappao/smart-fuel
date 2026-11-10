import { getLatestPriceUpdate } from '../../../lib/mimit/getLatestPriceUpdate'

// Letta dal browser a ogni visita: la homepage è ISR e da sola mostrerebbe
// la data dell'ultima rigenerazione, non quella dell'ultimo import.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const latestCommunicatedAt = await getLatestPriceUpdate()

  return Response.json(
    { latestCommunicatedAt },
    {
      headers: {
        // Un minuto di cache sul CDN, nessuna nel browser.
        'Cache-Control': 'public, max-age=0, s-maxage=60',
      },
    },
  )
}
