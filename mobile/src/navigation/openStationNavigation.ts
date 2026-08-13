import { AppLauncher } from '@capacitor/app-launcher'

export interface StationNavigationDestination {
  latitude: number
  longitude: number
}

const navigationErrorMessage =
  'Non riesco ad aprire il navigatore. Riprova.'

export class StationNavigationError extends Error {
  constructor() {
    super(navigationErrorMessage)
    this.name = 'StationNavigationError'
  }
}

function assertValidDestination({
  latitude,
  longitude,
}: StationNavigationDestination): void {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new StationNavigationError()
  }
}

export function buildNativeNavigationUrl(
  destination: StationNavigationDestination,
): string {
  assertValidDestination(destination)

  const searchParams = new URLSearchParams({
    q: `${destination.latitude},${destination.longitude}`,
    mode: 'd',
  })

  return `google.navigation:${searchParams}`
}

export function buildFallbackNavigationUrl(
  destination: StationNavigationDestination,
): string {
  assertValidDestination(destination)

  const navigationUrl = new URL('https://www.google.com/maps/dir/')
  navigationUrl.searchParams.set('api', '1')
  navigationUrl.searchParams.set(
    'destination',
    `${destination.latitude},${destination.longitude}`,
  )
  navigationUrl.searchParams.set('travelmode', 'driving')
  navigationUrl.searchParams.set('dir_action', 'navigate')

  return navigationUrl.toString()
}

export async function openStationNavigation(
  destination: StationNavigationDestination,
): Promise<void> {
  const nativeUrl = buildNativeNavigationUrl(destination)
  const fallbackUrl = buildFallbackNavigationUrl(destination)

  try {
    const { value: canOpenNativeNavigation } =
      await AppLauncher.canOpenUrl({ url: nativeUrl })

    if (canOpenNativeNavigation) {
      const { completed } = await AppLauncher.openUrl({ url: nativeUrl })

      if (completed) {
        return
      }
    }
  } catch {
    // The HTTPS Maps URL below remains available when native launch fails.
  }

  try {
    const { completed } = await AppLauncher.openUrl({ url: fallbackUrl })

    if (completed) {
      return
    }
  } catch {
    // Expose one controlled message instead of native plugin details.
  }

  throw new StationNavigationError()
}
