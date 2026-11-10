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

  it('builds the native Waze scheme with HTTPS fallback', () => {
    expect(buildNativeNavigationUrl(destination, 'waze')).toBe(
      'waze://?ll=41.8992,12.4731&navigate=yes',
    )
    expect(buildFallbackNavigationUrl(destination, 'waze')).toBe(
      'https://www.waze.com/ul?ll=41.8992,12.4731&navigate=yes',
    )
  })

  it('uses only the HTTPS link for Apple Maps', () => {
    expect(buildNativeNavigationUrl(destination, 'apple')).toBeNull()
    expect(buildFallbackNavigationUrl(destination, 'apple')).toBe(
      'https://maps.apple.com/?daddr=41.8992,12.4731&dirflg=d',
    )
  })

  it('opens Waze natively when it is installed', async () => {
    canOpenUrlMock.mockResolvedValue({ value: true })
    openUrlMock.mockResolvedValue({ completed: true })

    await openStationNavigation(destination, 'waze')

    expect(canOpenUrlMock).toHaveBeenCalledWith({
      url: 'waze://?ll=41.8992,12.4731&navigate=yes',
    })
    expect(openUrlMock).toHaveBeenCalledOnce()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'waze://?ll=41.8992,12.4731&navigate=yes',
    })
  })

  it('falls back to the Waze HTTPS link when Waze is not installed', async () => {
    canOpenUrlMock.mockResolvedValue({ value: false })
    openUrlMock.mockResolvedValue({ completed: true })

    await openStationNavigation(destination, 'waze')

    expect(openUrlMock).toHaveBeenCalledOnce()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'https://www.waze.com/ul?ll=41.8992,12.4731&navigate=yes',
    })
  })

  it('opens Apple Maps through HTTPS without probing a native scheme', async () => {
    openUrlMock.mockResolvedValue({ completed: true })

    await openStationNavigation(destination, 'apple')

    expect(canOpenUrlMock).not.toHaveBeenCalled()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'https://maps.apple.com/?daddr=41.8992,12.4731&dirflg=d',
    })
  })

  it('returns the same controlled error for Waze when every launch fails', async () => {
    canOpenUrlMock.mockRejectedValue(new Error('raw probe failure'))
    openUrlMock.mockResolvedValue({ completed: false })

    await expect(openStationNavigation(destination, 'waze')).rejects.toEqual(
      new StationNavigationError(),
    )
  })

  it.each(
    [
      { latitude: Number.NaN, longitude: 12.4731 },
      { latitude: 91, longitude: 12.4731 },
      { latitude: 41.8992, longitude: Number.POSITIVE_INFINITY },
      { latitude: 41.8992, longitude: -181 },
    ].flatMap((value) =>
      (['google', 'waze', 'apple'] as const).map((app) => ({ value, app })),
    ),
  )('rejects invalid coordinates for $app without opening another app', async ({
    value,
    app,
  }) => {
    await expect(openStationNavigation(value, app)).rejects.toEqual(
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

  it('sends Waze and Apple Maps to the station, without waypoints', () => {
    expect(buildTripNavigationUrl(request, 'waze')).toBe(
      'https://www.waze.com/ul?ll=44.8015,10.3279&navigate=yes',
    )
    expect(buildTripNavigationUrl(request, 'apple')).toBe(
      'https://maps.apple.com/?daddr=44.8015,10.3279&dirflg=d',
    )
  })

  it('opens Waze natively towards the station during a trip', async () => {
    canOpenUrlMock.mockResolvedValue({ value: true })
    openUrlMock.mockResolvedValue({ completed: true })

    await openTripNavigation(request, 'waze')

    expect(openUrlMock).toHaveBeenCalledOnce()
    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'waze://?ll=44.8015,10.3279&navigate=yes',
    })
  })

  it('rejects invalid trip coordinates with the controlled error', async () => {
    await expect(
      openTripNavigation({
        ...request,
        origin: { latitude: Number.NaN, longitude: 9.19 },
      }),
    ).rejects.toEqual(new StationNavigationError())
    expect(openUrlMock).not.toHaveBeenCalled()
  })
})
