import { describe, expect, it } from 'vitest'

import {
  buildStationNavigationUrl,
  buildTripNavigationUrl,
} from './navigationApps'

const station = { latitude: 45.47, longitude: 9.18 }
const origin = { latitude: 45.5, longitude: 9.2 }
const destination = { latitude: 44.4949, longitude: 11.3426 }

describe('buildStationNavigationUrl', () => {
  it('builds a Google Maps driving navigation link', () => {
    const url = new URL(buildStationNavigationUrl('google', station) ?? '')

    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('destination')).toBe('45.47,9.18')
    expect(url.searchParams.get('travelmode')).toBe('driving')
    expect(url.searchParams.get('dir_action')).toBe('navigate')
  })

  it('builds an Apple Maps driving directions link', () => {
    const url = new URL(buildStationNavigationUrl('apple', station) ?? '')

    expect(url.origin).toBe('https://maps.apple.com')
    expect(url.searchParams.get('daddr')).toBe('45.47,9.18')
    expect(url.searchParams.get('dirflg')).toBe('d')
  })

  it('builds a Waze navigation link', () => {
    const url = new URL(buildStationNavigationUrl('waze', station) ?? '')

    expect(url.origin + url.pathname).toBe('https://www.waze.com/ul')
    expect(url.searchParams.get('ll')).toBe('45.47,9.18')
    expect(url.searchParams.get('navigate')).toBe('yes')
  })

  it('returns null for invalid coordinates', () => {
    for (const app of ['google', 'apple', 'waze'] as const) {
      expect(
        buildStationNavigationUrl(app, { latitude: 120, longitude: 9 }),
      ).toBeNull()
      expect(
        buildStationNavigationUrl(app, { latitude: Number.NaN, longitude: 9 }),
      ).toBeNull()
    }
  })
})

describe('buildTripNavigationUrl', () => {
  it('keeps origin, stop and destination for Google Maps', () => {
    const url = new URL(
      buildTripNavigationUrl('google', { origin, destination, station }) ?? '',
    )

    expect(url.searchParams.get('origin')).toBe('45.5,9.2')
    expect(url.searchParams.get('destination')).toBe('44.4949,11.3426')
    expect(url.searchParams.get('waypoints')).toBe('45.47,9.18')
    expect(url.searchParams.get('travelmode')).toBe('driving')
  })

  it('navigates to the stop for apps without waypoint links', () => {
    expect(
      buildTripNavigationUrl('waze', { origin, destination, station }),
    ).toBe(buildStationNavigationUrl('waze', station))
    expect(
      buildTripNavigationUrl('apple', { origin, destination, station }),
    ).toBe(buildStationNavigationUrl('apple', station))
  })

  it('returns null when any Google Maps trip point is invalid', () => {
    expect(
      buildTripNavigationUrl('google', {
        origin: { latitude: 91, longitude: 0 },
        destination,
        station,
      }),
    ).toBeNull()
  })
})
