import { describe, expect, it } from 'vitest'

import { getAvailableNavigationApps } from './useMobileNavigationApp'

describe('getAvailableNavigationApps', () => {
  it('offers Apple Maps only on iOS', () => {
    expect(getAvailableNavigationApps('ios')).toEqual([
      'google',
      'apple',
      'waze',
    ])
    expect(getAvailableNavigationApps('android')).toEqual(['google', 'waze'])
    expect(getAvailableNavigationApps('web')).toEqual(['google', 'waze'])
  })
})
