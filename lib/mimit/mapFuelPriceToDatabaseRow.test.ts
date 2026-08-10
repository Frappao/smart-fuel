import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapFuelPriceToDatabaseRow } from './mapFuelPriceToDatabaseRow'

describe('mapFuelPriceToDatabaseRow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mappa il prezzo in snake_case e converte la data MIMIT', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T09:15:30.000Z'))

    const result = mapFuelPriceToDatabaseRow(
      {
        mimitId: 3464,
        fuelType: 'Benzina',
        price: 2.089,
        isSelf: true,
        communicatedAt: '06/08/2026 13:30:07',
      },
      123,
    )

    expect(result).toEqual({
      station_id: 123,
      fuel_type: 'Benzina',
      price: 2.089,
      is_self: true,
      communicated_at: '2026-08-06T13:30:07',
      updated_at: '2026-08-10T09:15:30.000Z',
    })
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('mimitId')
  })
})
