import { geocodeAddress } from '../../../lib/maps/geocodeAddress'

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 256
const MAX_QUERY_PARTS = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidQuery(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const query = value.trim()

  return (
    query.length >= MIN_QUERY_LENGTH &&
    query.length <= MAX_QUERY_LENGTH &&
    !query.includes(';') &&
    query.split(/\s+/u).length <= MAX_QUERY_PARTS
  )
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!isRecord(body) || !isValidQuery(body.query)) {
    return Response.json(
      { error: 'Provide a valid address or place.' },
      { status: 400 },
    )
  }

  try {
    const results = await geocodeAddress(body.query.trim())

    return Response.json({ results })
  } catch {
    return Response.json(
      { error: 'Unable to search for this location.' },
      { status: 502 },
    )
  }
}
