import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCurrentPosition } from './getCurrentPosition'

function stubGeolocationError(code: number) {
  const browserGetCurrentPosition = vi.fn(
    (
      _success: PositionCallback,
      error: PositionErrorCallback | null | undefined,
    ) => {
      error?.({ code, message: 'Browser geolocation error' } as GeolocationPositionError)
    },
  )

  vi.stubGlobal('navigator', {
    geolocation: { getCurrentPosition: browserGetCurrentPosition },
  })
}

describe('getCurrentPosition', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the current coordinates and uses the requested options', async () => {
    const browserGetCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.4642,
          longitude: 9.19,
          accuracy: 20,
        },
      } as GeolocationPosition)
    })

    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: browserGetCurrentPosition },
    })

    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })

    expect(browserGetCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    )
  })

  it('throws a clear Error when geolocation is unavailable', async () => {
    vi.stubGlobal('navigator', {})

    await expect(getCurrentPosition()).rejects.toThrow(
      'Geolocation is not available in this browser.',
    )
  })

  it('explains when location permission is denied', async () => {
    stubGeolocationError(1)

    await expect(getCurrentPosition()).rejects.toThrow(
      /location permission was denied/i,
    )
  })

  it('explains when the position is unavailable', async () => {
    stubGeolocationError(2)

    await expect(getCurrentPosition()).rejects.toThrow(
      /location could not be determined/i,
    )
  })

  it('explains when the location request times out', async () => {
    stubGeolocationError(3)

    await expect(getCurrentPosition()).rejects.toThrow(
      /location request timed out/i,
    )
  })
})
