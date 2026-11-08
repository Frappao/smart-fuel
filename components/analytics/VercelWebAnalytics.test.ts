import { describe, expect, it } from 'vitest'

import { redactAnalyticsUrl } from './VercelWebAnalytics'

describe('redactAnalyticsUrl', () => {
  it('keeps only the path, the share flag and UTM parameters', () => {
    expect(
      redactAnalyticsUrl(
        'https://rifornio.it/?condividi=1&nome=Q8%20Centro&prezzo=1.799&utm_source=whatsapp#risultati',
      ),
    ).toBe('https://rifornio.it/?condividi=1&utm_source=whatsapp')
  })

  it('drops every query parameter that is not explicitly allowed', () => {
    expect(
      redactAnalyticsUrl('https://rifornio.it/prezzi-carburante/milano?lat=45.46&lng=9.19'),
    ).toBe('https://rifornio.it/prezzi-carburante/milano')
  })

  it('returns unparsable values unchanged', () => {
    expect(redactAnalyticsUrl('/relative/path')).toBe('/relative/path')
  })
})
