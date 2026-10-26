import { verifyPriceFreshness } from '../../../lib/mimit/verifyPriceFreshness'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  try {
    const report = await verifyPriceFreshness()
    const httpStatus =
      report.status === 'stale' || report.status === 'empty' ? 503 : 200

    return Response.json(report, { status: httpStatus })
  } catch (error) {
    console.error('Price freshness check failed:', error)

    return Response.json(
      { error: 'Unable to verify price freshness.' },
      { status: 500 },
    )
  }
}
