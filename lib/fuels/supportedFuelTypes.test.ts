import { describe, expect, it } from 'vitest'

import {
  isSupportedFuelType,
  SUPPORTED_FUEL_TYPE_LABELS,
  SUPPORTED_FUEL_TYPES,
} from './supportedFuelTypes'

describe('supported fuel types', () => {
  it.each(SUPPORTED_FUEL_TYPES)('accepts %s', (fuelType) => {
    expect(isSupportedFuelType(fuelType)).toBe(true)
  })

  it.each(['Diesel', 'Metano'])('rejects unsupported value %s', (value) => {
    expect(isSupportedFuelType(value)).toBe(false)
  })

  it('provides the UI label for every supported value', () => {
    expect(SUPPORTED_FUEL_TYPE_LABELS).toEqual({
      Benzina: 'Benzina',
      Gasolio: 'Gasolio',
      GPL: 'GPL',
    })
  })
})
