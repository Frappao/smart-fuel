import { Geolocation, type Position } from '@capacitor/geolocation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getMobileCurrentPosition,
  MobileLocationError,
} from './getMobileCurrentPosition'

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
}))

const checkPermissionsMock = vi.mocked(Geolocation.checkPermissions)
const requestPermissionsMock = vi.mocked(Geolocation.requestPermissions)
const getCurrentPositionMock = vi.mocked(Geolocation.getCurrentPosition)

function createPosition(
  latitude = 41.9028,
  longitude = 12.4964,
  accuracy = 18,
): Position {
  return {
    timestamp: Date.now(),
    coords: {
      latitude,
      longitude,
      accuracy,
      altitudeAccuracy: null,
      altitude: null,
      speed: null,
      heading: null,
      magneticHeading: null,
      trueHeading: null,
      headingAccuracy: null,
      course: null,
    },
  }
}

describe('getMobileCurrentPosition', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    getCurrentPositionMock.mockResolvedValue(createPosition())
  })

  it('uses an already granted permission without requesting it again', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    })

    await expect(getMobileCurrentPosition()).resolves.toEqual({
      latitude: 41.9028,
      longitude: 12.4964,
      accuracy: 18,
    })
    expect(requestPermissionsMock).not.toHaveBeenCalled()
  })

  it('requests a pending permission and continues when granted', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'prompt',
      coarseLocation: 'prompt',
    })
    requestPermissionsMock.mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    })

    await getMobileCurrentPosition()

    expect(requestPermissionsMock).toHaveBeenCalledWith({
      permissions: ['location'],
    })
    expect(getCurrentPositionMock).toHaveBeenCalledOnce()
  })

  it('accepts approximate location permission on Android', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'denied',
      coarseLocation: 'granted',
    })

    await expect(getMobileCurrentPosition()).resolves.toMatchObject({
      latitude: 41.9028,
      longitude: 12.4964,
    })
    expect(requestPermissionsMock).not.toHaveBeenCalled()
  })

  it('returns a readable permission-denied error', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'prompt',
      coarseLocation: 'prompt',
    })
    requestPermissionsMock.mockResolvedValue({
      location: 'denied',
      coarseLocation: 'denied',
    })

    await expect(getMobileCurrentPosition()).rejects.toEqual(
      new MobileLocationError('permission-denied'),
    )
    expect(getCurrentPositionMock).not.toHaveBeenCalled()
  })

  it('requests one high-accuracy position with a bounded cache and timeout', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    })

    await getMobileCurrentPosition()

    expect(getCurrentPositionMock).toHaveBeenCalledWith({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 60_000,
    })
  })

  it('maps unavailable native location errors to a readable error', async () => {
    checkPermissionsMock.mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' })

    await expect(getMobileCurrentPosition()).rejects.toEqual(
      new MobileLocationError('position-unavailable'),
    )
  })

  it('maps native timeouts to a readable error', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    })
    getCurrentPositionMock.mockRejectedValue({ code: 'OS-PLUG-GLOC-0010' })

    await expect(getMobileCurrentPosition()).rejects.toEqual(
      new MobileLocationError('timeout'),
    )
  })

  it('does not expose raw details for unknown plugin errors', async () => {
    checkPermissionsMock.mockResolvedValue({
      location: 'granted',
      coarseLocation: 'granted',
    })
    getCurrentPositionMock.mockRejectedValue(
      new Error('raw native implementation detail'),
    )

    await expect(getMobileCurrentPosition()).rejects.toEqual(
      new MobileLocationError('unknown'),
    )
  })
})
