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

  return browserGetCurrentPosition
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
      'La geolocalizzazione non è disponibile in questo browser.',
    )
  })

  it('explains when location permission is denied', async () => {
    const browserGetCurrentPosition = stubGeolocationError(1)

    await expect(getCurrentPosition()).rejects.toThrow(
      /accesso alla posizione negato/i,
    )
    // Con il permesso negato non si riprova.
    expect(browserGetCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('explains when the position is unavailable', async () => {
    const browserGetCurrentPosition = stubGeolocationError(2)

    await expect(getCurrentPosition()).rejects.toThrow(
      /non è stato possibile determinare la tua posizione/i,
    )
    expect(browserGetCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('falls back to low accuracy when high accuracy is unavailable (Mac)', async () => {
    const browserGetCurrentPosition = vi.fn(
      (
        success: PositionCallback,
        error: PositionErrorCallback | null | undefined,
        options?: PositionOptions,
      ) => {
        if (options?.enableHighAccuracy) {
          error?.({ code: 2, message: 'kCLErrorLocationUnknown' } as GeolocationPositionError)
          return
        }
        success({
          coords: { latitude: 41.9, longitude: 12.5, accuracy: 65 },
        } as GeolocationPosition)
      },
    )

    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: browserGetCurrentPosition },
    })

    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 41.9,
      longitude: 12.5,
      accuracy: 65,
    })
    expect(browserGetCurrentPosition).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
    )
  })

  it('explains when the location request times out', async () => {
    stubGeolocationError(3)

    await expect(getCurrentPosition()).rejects.toThrow(
      /troppo tempo/i,
    )
  })
})
