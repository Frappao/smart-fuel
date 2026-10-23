import { describe, expect, it } from 'vitest'
import { formatCityFromSlug, POPULAR_CITIES } from './popularCities'

describe('popularCities', () => {
  it('contains over 100 cities covering all Italian regions', () => {
    expect(POPULAR_CITIES.length).toBeGreaterThan(100)

    const regions = new Set(POPULAR_CITIES.map((c) => c.region))
    expect(regions.size).toBe(20)
  })

  it('ensures every city has unique and URL-safe slugs', () => {
    const slugs = new Set<string>()

    for (const city of POPULAR_CITIES) {
      expect(city.slug).toMatch(/^[a-z0-9-]+$/)
      expect(slugs.has(city.slug)).toBe(false)
      slugs.add(city.slug)
    }
  })

  it('ensures every city has valid coordinates and province code', () => {
    for (const city of POPULAR_CITIES) {
      expect(city.province).toMatch(/^[A-Z]{2}$/)
      expect(city.latitude).toBeGreaterThan(35)
      expect(city.latitude).toBeLessThan(48)
      expect(city.longitude).toBeGreaterThan(6)
      expect(city.longitude).toBeLessThan(19)
    }
  })

  it('formats city name from slug properly', () => {
    expect(formatCityFromSlug('roma')).toBe('Roma')
    expect(formatCityFromSlug('laquila')).toBe("L'Aquila")
    expect(formatCityFromSlug('forli')).toBe('Forlì')
    expect(formatCityFromSlug('san-donato-milanese')).toBe('San Donato Milanese')
  })

  it('sanitizes input with brackets or encoding', () => {
    expect(formatCityFromSlug('[roma]')).toBe('Roma')
    expect(formatCityFromSlug('%5Broma%5D')).toBe('Roma')
  })
})
