import { AppLauncher } from '@capacitor/app-launcher'

import {
  buildStationNavigationUrl,
  buildTripNavigationUrl as buildSharedTripNavigationUrl,
  supportsTripWaypoint,
  type NavigationApp,
} from '../../../lib/navigation/navigationApps'

export interface StationNavigationDestination {
  latitude: number
  longitude: number
}

export interface TripNavigationRequest {
  origin: StationNavigationDestination
  destination: StationNavigationDestination
  station: StationNavigationDestination
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

/**
 * Schema nativo dell'app scelta, se esiste. Apple Maps non ne ha bisogno:
 * su iOS il link HTTPS apre già l'app.
 */
export function buildNativeNavigationUrl(
  destination: StationNavigationDestination,
  app: NavigationApp = 'google',
): string | null {
  assertValidDestination(destination)

  const coordinates = `${destination.latitude},${destination.longitude}`

  if (app === 'waze') {
    return `waze://?ll=${coordinates}&navigate=yes`
  }

  if (app === 'apple') return null

  const searchParams = new URLSearchParams({ q: coordinates, mode: 'd' })
  return `google.navigation:${searchParams}`
}

/** Link HTTPS universale: apre l'app se installata, altrimenti il web. */
export function buildFallbackNavigationUrl(
  destination: StationNavigationDestination,
  app: NavigationApp = 'google',
): string {
  assertValidDestination(destination)

  const url = buildStationNavigationUrl(app, destination)
  if (!url) throw new StationNavigationError()
  return url
}

async function openUrlCompleted(url: string): Promise<boolean> {
  try {
    const { completed } = await AppLauncher.openUrl({ url })
    return completed
  } catch {
    return false
  }
}

export async function openStationNavigation(
  destination: StationNavigationDestination,
  app: NavigationApp = 'google',
): Promise<void> {
  const nativeUrl = buildNativeNavigationUrl(destination, app)
  const fallbackUrl = buildFallbackNavigationUrl(destination, app)

  if (nativeUrl) {
    try {
      const { value: canOpenNativeNavigation } =
        await AppLauncher.canOpenUrl({ url: nativeUrl })

      if (canOpenNativeNavigation && (await openUrlCompleted(nativeUrl))) {
        return
      }
    } catch {
      // The HTTPS URL below remains available when native launch fails.
    }
  }

  // Expose one controlled message instead of native plugin details.
  if (await openUrlCompleted(fallbackUrl)) return

  throw new StationNavigationError()
}

/**
 * Google Maps apre il viaggio con il distributore come sosta. Per le app che
 * non accettano soste nel link restituisce il link al distributore.
 */
export function buildTripNavigationUrl(
  { origin, destination, station }: TripNavigationRequest,
  app: NavigationApp = 'google',
): string {
  assertValidDestination(origin)
  assertValidDestination(destination)
  assertValidDestination(station)

  const url = buildSharedTripNavigationUrl(app, {
    origin,
    destination,
    station,
  })
  if (!url) throw new StationNavigationError()

  if (!supportsTripWaypoint(app)) return url

  // Nell'app avvia subito la navigazione invece della sola anteprima.
  const navigationUrl = new URL(url)
  navigationUrl.searchParams.set('dir_action', 'navigate')
  return navigationUrl.toString()
}

export async function openTripNavigation(
  request: TripNavigationRequest,
  app: NavigationApp = 'google',
): Promise<void> {
  if (!supportsTripWaypoint(app)) {
    // Waze e Apple Maps: si arriva al distributore, poi si riparte.
    await openStationNavigation(request.station, app)
    return
  }

  const url = buildTripNavigationUrl(request, app)

  if (await openUrlCompleted(url)) return

  throw new StationNavigationError()
}
