import { describe, expect, it } from 'vitest'

import {
  EMPTY_ACCOUNT_PREFERENCES,
  parseAccountPreferences,
  serializeAccountPreferences,
} from './accountPreferences'

describe('account preferences', () => {
  it('reads valid preferences from the user metadata', () => {
    expect(
      parseAccountPreferences({
        full_name: 'Mario',
        rifornio: {
          default_vehicle_id: 'car-1',
          is_self: false,
          refuel_amount: 40,
          search_mode: 'trip',
        },
      }),
    ).toEqual({
      defaultVehicleId: 'car-1',
      isSelf: false,
      refuelAmount: 40,
      searchMode: 'trip',
    })
  })

  it.each([
    ['missing metadata', undefined],
    ['no Rifornio key', { full_name: 'Mario' }],
    ['a non-object value', { rifornio: 'yes' }],
  ])('falls back to empty preferences with %s', (_case, metadata) => {
    expect(parseAccountPreferences(metadata)).toEqual(EMPTY_ACCOUNT_PREFERENCES)
  })

  it('drops invalid single values and keeps the valid ones', () => {
    expect(
      parseAccountPreferences({
        rifornio: {
          default_vehicle_id: 42,
          is_self: 'true',
          refuel_amount: -5,
          search_mode: 'flight',
        },
      }),
    ).toEqual(EMPTY_ACCOUNT_PREFERENCES)
    expect(
      parseAccountPreferences({ rifornio: { refuel_amount: 5_000, is_self: true } }),
    ).toEqual({ ...EMPTY_ACCOUNT_PREFERENCES, isSelf: true })
  })

  it('serializes back to the metadata shape', () => {
    const preferences = {
      defaultVehicleId: 'car-2',
      isSelf: true,
      refuelAmount: 60,
      searchMode: 'nearby' as const,
    }

    expect(
      parseAccountPreferences({ rifornio: serializeAccountPreferences(preferences) }),
    ).toEqual(preferences)
  })
})
