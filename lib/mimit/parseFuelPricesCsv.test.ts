import { describe, expect, it } from 'vitest'

import { parseFuelPricesCsv } from './parseFuelPricesCsv'

describe('parseFuelPricesCsv', () => {
  it('parsa un estratto realistico dei prezzi MIMIT', () => {
    const csv = [
      'Estrazione del 2026-08-06',
      'idImpianto|descCarburante|prezzo|isSelf|dtComu',
      '3464| Benzina | 2.449 | 0 | 06/08/2026 13:30:09',
      '3464|Benzina|2.089|TRUE|06/08/2026 13:30:07',
      '3464|Gasolio|1.999|false|',
      '',
    ].join('\n')

    expect(parseFuelPricesCsv(csv)).toEqual([
      {
        mimitId: 3464,
        fuelType: 'Benzina',
        price: 2.449,
        isSelf: false,
        communicatedAt: '06/08/2026 13:30:09',
      },
      {
        mimitId: 3464,
        fuelType: 'Benzina',
        price: 2.089,
        isSelf: true,
        communicatedAt: '06/08/2026 13:30:07',
      },
      {
        mimitId: 3464,
        fuelType: 'Gasolio',
        price: 1.999,
        isSelf: false,
        communicatedAt: null,
      },
    ])
  })
})
