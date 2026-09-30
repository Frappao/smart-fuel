import { AppLauncher } from '@capacitor/app-launcher'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildFallbackNavigationUrl,
  buildNativeNavigationUrl,
  buildTripNavigationUrl,
  openStationNavigation,
  openTripNavigation,
  StationNavigationError,
} from './openStationNavigation'

vi.mock('@capacitor/app-launcher', () => ({
  AppLauncher: {
    canOpenUrl: vi.fn(),
    openUrl: vi.fn(),
  },
}))

const canOpenUrlMock = vi.mocked(AppLauncher.canOpenUrl)
const openUrlMock = vi.mocked(AppLauncher.openUrl)
const destination = { latitude: 41.8992, longitude: 12.4731 }

describe('openStationNavigation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a native driving navigation deep link from valid coordinates', () => {
    expect(buildNativeNavigationUrl(destination)).toBe(
      'google.navigation:q=41.8992%2C12.4731&mode=d',
    )
  })

  it('builds an encoded HTTPS Google Maps fallback', () => {
    const fallbackUrl = new URL(buildFallbackNavigationUrl(destination))

    expect(fallbackUrl.origin).toBe('https://www.google.com')
    expect(fallbackUrl.pathname).toBe('/maps/dir/')
    expect(fallbackUrl.searchParams.get('api')).toBe('1')
    expect(fallbackUrl.searchParams.get('destination')).toBe(
      '41.8992,12.4731',
    )
    expect(fallbackUrl.searchParams.get('travelmode')).toBe('driving')
    expect(fallbackUrl.searchParams.get('dir_action')).toBe('navigate')
  })

  it('opens native navigation when it is available', async () => {
    canOpenUrlMock.mockResolvedValue({ value: true })
    openUrlMock.mockResolvedValue({ completed: true })

    await expect(openStationNavigation(destination)).resolves.toBeUndefined()

    expect(openUrlMock).toHaveBeenCalledOnce()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'google.navigation:q=41.8992%2C12.4731&mode=d',
    })
  })

  it('uses the HTTPS fallback when native navigation is unavailable', async () => {
    canOpenUrlMock.mockResolvedValue({ value: false })
    openUrlMock.mockResolvedValue({ completed: true })

    await openStationNavigation(destination)

    expect(openUrlMock).toHaveBeenCalledOnce()
    expect(new URL(openUrlMock.mock.calls[0][0].url).protocol).toBe('https:')
  })

  it('uses the HTTPS fallback when the native launch fails', async () => {
    canOpenUrlMock.mockResolvedValue({ value: true })
    openUrlMock
      .mockRejectedValueOnce(new Error('raw native failure'))
      .mockResolvedValueOnce({ completed: true })

    await openStationNavigation(destination)

    expect(openUrlMock).toHaveBeenCalledTimes(2)
    expect(new URL(openUrlMock.mock.calls[1][0].url).protocol).toBe('https:')
  })

  it('uses the HTTPS fallback when the native launcher is not completed', async () => {
    canOpenUrlMock.mockResolvedValue({ value: true })
    openUrlMock
      .mockResolvedValueOnce({ completed: false })
      .mockResolvedValueOnce({ completed: true })

    await openStationNavigation(destination)

    expect(openUrlMock).toHaveBeenCalledTimes(2)
    expect(new URL(openUrlMock.mock.calls[1][0].url).protocol).toBe('https:')
  })

  it.each([
    { latitude: Number.NaN, longitude: 12.4731 },
    { latitude: 91, longitude: 12.4731 },
    { latitude: 41.8992, longitude: Number.POSITIVE_INFINITY },
    { latitude: 41.8992, longitude: -181 },
  ])('rejects invalid coordinates without opening another app', async (value) => {
    await expect(openStationNavigation(value)).rejects.toEqual(
      new StationNavigationError(),
    )
    expect(canOpenUrlMock).not.toHaveBeenCalled()
    expect(openUrlMock).not.toHaveBeenCalled()
  })

  it('returns a controlled error when the HTTPS fallback also fails', async () => {
    canOpenUrlMock.mockResolvedValue({ value: false })
    openUrlMock.mockRejectedValue(new Error('raw fallback failure'))

    await expect(openStationNavigation(destination)).rejects.toEqual(
      new StationNavigationError(),
    )
  })
})

describe('openTripNavigation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const request = {
    origin: { latitude: 45.4642, longitude: 9.19 },
    destination: { latitude: 44.4949, longitude: 11.3426 },
    station: { latitude: 44.8015, longitude: 10.3279 },
  }

  it('builds a Google Maps route with the station as waypoint', () => {
    const url = new URL(buildTripNavigationUrl(request))

    expect(url.searchParams.get('origin')).toBe('45.4642,9.19')
    expect(url.searchParams.get('destination')).toBe('44.4949,11.3426')
    expect(url.searchParams.get('waypoints')).toBe('44.8015,10.3279')
    expect(url.searchParams.get('travelmode')).toBe('driving')
    expect(url.searchParams.get('dir_action')).toBe('navigate')
  })

  it('opens the trip URL and reports launcher failures consistently', async () => {
    openUrlMock.mockResolvedValueOnce({ completed: true })
    await expect(openTripNavigation(request)).resolves.toBeUndefined()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: buildTripNavigationUrl(request),
    })

    openUrlMock.mockResolvedValueOnce({ completed: false })
    await expect(openTripNavigation(request)).rejects.toEqual(
      new StationNavigationError(),
    )
  })
})
