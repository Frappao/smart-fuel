import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { geocodeAddress } from './geocodeAddress'

const TEST_ACCESS_TOKEN = 'test-mapbox-access-token'
const fetchMock = vi.fn()

function arrangeMapboxResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', TEST_ACCESS_TOKEN)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('requests Italian non-autocomplete results and maps valid features', async () => {
    arrangeMapboxResponse({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [9.19, 45.4642] },
          properties: {
            mapbox_id: 'dXJuOm1ieGFkcjoabc',
            full_address: 'Piazza del Duomo, 20122 Milano MI, Italia',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [12.4964, 41.9028] },
          properties: {
            mapbox_id: 'dXJuOm1ieHBsYzp4eXo',
            name: 'Roma',
            place_formatted: 'Lazio, Italia',
          },
        },
      ],
    })

    await expect(geocodeAddress('Piazza Duomo, Milano')).resolves.toEqual([
      {
        id: 'dXJuOm1ieGFkcjoabc',
        label: 'Piazza del Duomo, 20122 Milano MI, Italia',
        latitude: 45.4642,
        longitude: 9.19,
      },
      {
        id: 'dXJuOm1ieHBsYzp4eXo',
        label: 'Roma, Lazio, Italia',
        latitude: 41.9028,
        longitude: 12.4964,
      },
    ])

    const requestUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestUrl).toBeInstanceOf(URL)

    const url = requestUrl as URL
    expect(url.origin + url.pathname).toBe(
      'https://api.mapbox.com/search/geocode/v6/forward',
    )
    expect(url.searchParams.get('q')).toBe('Piazza Duomo, Milano')
    expect(url.searchParams.get('country')).toBe('it')
    expect(url.searchParams.get('language')).toBe('it')
    expect(url.searchParams.get('autocomplete')).toBe('false')
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('access_token')).toBe(TEST_ACCESS_TOKEN)
  })

  it('skips malformed individual features without shifting valid results', async () => {
    arrangeMapboxResponse({
      features: [
        {
          geometry: { type: 'Point', coordinates: ['invalid', 45] },
          properties: { mapbox_id: 'invalid', full_address: 'Invalid' },
        },
        {
          geometry: { type: 'Point', coordinates: [11.3426, 44.4949] },
          properties: {
            mapbox_id: 'bologna',
            full_address: 'Bologna, Emilia-Romagna, Italia',
          },
        },
      ],
    })

    await expect(geocodeAddress('Bologna')).resolves.toEqual([
      {
        id: 'bologna',
        label: 'Bologna, Emilia-Romagna, Italia',
        latitude: 44.4949,
        longitude: 11.3426,
      },
    ])
  })

  it('rejects invalid payloads and failed HTTP responses', async () => {
    arrangeMapboxResponse({ features: null })
    await expect(geocodeAddress('Milano')).rejects.toThrow(
      'Mapbox Geocoding returned an invalid response.',
    )

    arrangeMapboxResponse({ message: 'Too Many Requests' }, false, 429)
    await expect(geocodeAddress('Milano')).rejects.toThrow('HTTP status 429')
  })

  it('requires a server-side access token', async () => {
    vi.stubEnv('MAPBOX_ACCESS_TOKEN', '')

    await expect(geocodeAddress('Milano')).rejects.toThrow(
      'MAPBOX_ACCESS_TOKEN is not configured.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
