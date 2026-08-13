import {
  Geolocation,
  type PermissionStatus,
} from '@capacitor/geolocation'

export interface MobilePosition {
  latitude: number
  longitude: number
  accuracy?: number
}

export type MobileLocationErrorCode =
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unknown'

const errorMessages: Record<MobileLocationErrorCode, string> = {
  'permission-denied':
    "Per trovare i distributori vicini devi consentire l'accesso alla posizione.",
  'position-unavailable':
    'Non riesco a determinare la tua posizione. Controlla i servizi di localizzazione e riprova.',
  timeout: 'La posizione sta impiegando troppo tempo. Riprova.',
  unknown: 'Non è stato possibile recuperare la posizione. Riprova.',
}

export class MobileLocationError extends Error {
  constructor(public readonly code: MobileLocationErrorCode) {
    super(errorMessages[code])
    this.name = 'MobileLocationError'
  }
}

function hasLocationPermission(status: PermissionStatus): boolean {
  return status.location === 'granted' || status.coarseLocation === 'granted'
}

function getPluginErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null
  }

  return typeof error.code === 'string' ? error.code : null
}

function toMobileLocationError(error: unknown): MobileLocationError {
  if (error instanceof MobileLocationError) {
    return error
  }

  switch (getPluginErrorCode(error)) {
    case 'OS-PLUG-GLOC-0003':
      return new MobileLocationError('permission-denied')
    case 'OS-PLUG-GLOC-0010':
      return new MobileLocationError('timeout')
    case 'OS-PLUG-GLOC-0002':
    case 'OS-PLUG-GLOC-0007':
    case 'OS-PLUG-GLOC-0009':
    case 'OS-PLUG-GLOC-0014':
    case 'OS-PLUG-GLOC-0015':
    case 'OS-PLUG-GLOC-0016':
    case 'OS-PLUG-GLOC-0017':
    case 'OS-PLUG-GLOC-0018':
      return new MobileLocationError('position-unavailable')
    default:
      return new MobileLocationError('unknown')
  }
}

export async function getMobileCurrentPosition(): Promise<MobilePosition> {
  try {
    let permissionStatus = await Geolocation.checkPermissions()

    if (!hasLocationPermission(permissionStatus)) {
      permissionStatus = await Geolocation.requestPermissions({
        permissions: ['location'],
      })
    }

    if (!hasLocationPermission(permissionStatus)) {
      throw new MobileLocationError('permission-denied')
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 60_000,
    })
    const { accuracy, latitude, longitude } = position.coords

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new MobileLocationError('position-unavailable')
    }

    return {
      latitude,
      longitude,
      ...(Number.isFinite(accuracy) ? { accuracy } : {}),
    }
  } catch (error) {
    throw toMobileLocationError(error)
  }
}
