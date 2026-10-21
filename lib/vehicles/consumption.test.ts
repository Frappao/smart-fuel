import { describe, expect, it } from 'vitest'
import { convertConsumption, toLitersPer100Km } from './consumption'

describe('consumption units', () => {
  it('normalizes equivalent consumption to the same ranking input', () => {
    expect(toLitersPer100Km(20, 'km/L')).toBe(5)
    expect(toLitersPer100Km(5, 'L/100 km')).toBe(5)
    expect(convertConsumption('5', 'km/L')).toBe('20')
  })
  it('rejects invalid values and reciprocal overflow', () => {
    for (const value of [0, -1, NaN, Infinity, Number.MIN_VALUE]) {
      expect(toLitersPer100Km(value, 'km/L')).toBeNull()
    }
    expect(convertConsumption('', 'km/L')).toBe('')
  })
})
