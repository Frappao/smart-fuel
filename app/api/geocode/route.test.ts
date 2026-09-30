import { beforeEach, describe, expect, it, vi } from 'vitest'

import { geocodeAddress } from '../../../lib/maps/geocodeAddress'
import { POST } from './route'

vi.mock('../../../lib/maps/geocodeAddress', () => ({
  geocodeAddress: vi.fn(),
}))

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/geocode', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('trims a valid query and returns selectable results', async () => {
    const results = [
      {
        id: 'milano',
        label: 'Milano, Lombardia, Italia',
        latitude: 45.4642,
        longitude: 9.19,
      },
    ]
    vi.mocked(geocodeAddress).mockResolvedValue(results)

    const response = await POST(createRequest({ query: '  Milano  ' }))

    expect(response.status).toBe(200)
    expect(geocodeAddress).toHaveBeenCalledWith('Milano')
    await expect(response.json()).resolves.toEqual({ results })
  })

  it.each([
    ['missing query', {}],
    ['short query', { query: 'a' }],
    ['semicolon', { query: 'Milano;Roma' }],
    ['too long', { query: 'a'.repeat(257) }],
    ['too many parts', { query: Array.from({ length: 21 }, () => 'a').join(' ') }],
  ])('rejects an invalid query: %s', async (_label, body) => {
    const response = await POST(createRequest(body))

    expect(response.status).toBe(400)
    expect(geocodeAddress).not.toHaveBeenCalled()
  })

  it('returns a generic upstream error without exposing credentials', async () => {
    const sensitiveToken = 'sensitive-mapbox-token'
    vi.mocked(geocodeAddress).mockRejectedValue(
      new Error(`Request failed with access_token=${sensitiveToken}`),
    )

    const response = await POST(createRequest({ query: 'Milano' }))
    const responseBody = await response.json()

    expect(response.status).toBe(502)
    expect(responseBody).toEqual({
      error: 'Unable to search for this location.',
    })
    expect(JSON.stringify(responseBody)).not.toContain(sensitiveToken)
  })
})
