import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapStationToDatabaseRow } from './mapStationToDatabaseRow'

describe('mapStationToDatabaseRow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mappa la stazione in snake_case senza aggiungere un id', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T09:15:30.000Z'))

    const result = mapStationToDatabaseRow({
      mimitId: 59183,
      manager: 'ENIMOOV S.P.A.',
      brand: 'Agip Eni',
      stationType: 'Stradale',
      name: 'ENI 59183',
      address: 'Via Roma 1',
      city: 'Milano',
      province: 'MI',
      latitude: 45.464211,
      longitude: 9.191383,
    })

    expect(result).toEqual({
      mimit_id: 59183,
      manager: 'ENIMOOV S.P.A.',
      brand: 'Agip Eni',
      station_type: 'Stradale',
      name: 'ENI 59183',
      address: 'Via Roma 1',
      city: 'Milano',
      province: 'MI',
      latitude: 45.464211,
      longitude: 9.191383,
      updated_at: '2026-08-10T09:15:30.000Z',
    })
    expect(result).not.toHaveProperty('id')
  })
})
