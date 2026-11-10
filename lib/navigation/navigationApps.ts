/**
 * Link di navigazione verso un distributore per le app più diffuse.
 * Sono link universali HTTPS: sul telefono aprono l'app se è installata,
 * altrimenti la versione web del servizio.
 */

export type NavigationApp = 'google' | 'apple' | 'waze'

export interface NavigationCoordinates {
  latitude: number
  longitude: number
}

export const NAVIGATION_APPS: readonly NavigationApp[] = [
  'google',
  'apple',
  'waze',
]

export const NAVIGATION_APP_LABELS: Record<NavigationApp, string> = {
  google: 'Google Maps',
  apple: 'Apple Maps',
  waze: 'Waze',
}

export function isNavigationApp(value: unknown): value is NavigationApp {
  return value === 'google' || value === 'apple' || value === 'waze'
}

function isValidCoordinates(
  coordinates: NavigationCoordinates,
): boolean {
  const { latitude, longitude } = coordinates

  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function formatCoordinates({ latitude, longitude }: NavigationCoordinates) {
  return `${latitude},${longitude}`
}

/** Navigazione in auto dalla posizione attuale fino al distributore. */
export function buildStationNavigationUrl(
  app: NavigationApp,
  station: NavigationCoordinates,
): string | null {
  if (!isValidCoordinates(station)) return null

  const destination = formatCoordinates(station)

  // Coordinate numeriche: nessun carattere da codificare. La virgola resta
  // letterale, nella forma documentata da Apple Maps e Waze.
  if (app === 'apple') {
    return `https://maps.apple.com/?daddr=${destination}&dirflg=d`
  }

  if (app === 'waze') {
    return `https://www.waze.com/ul?ll=${destination}&navigate=yes`
  }

  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('destination', destination)
  url.searchParams.set('travelmode', 'driving')
  url.searchParams.set('dir_action', 'navigate')
  return url.toString()
}

/** Le app che accettano la sosta intermedia aprono l'intero viaggio. */
export function supportsTripWaypoint(app: NavigationApp): boolean {
  return app === 'google'
}

/**
 * Viaggio con sosta al distributore. Google Maps riceve partenza, sosta e
 * destinazione; Apple Maps e Waze non accettano soste nei link, quindi
 * portano al distributore e da lì si riparte verso la destinazione.
 */
export function buildTripNavigationUrl(
  app: NavigationApp,
  {
    origin,
    destination,
    station,
  }: {
    origin: NavigationCoordinates
    destination: NavigationCoordinates
    station: NavigationCoordinates
  },
): string | null {
  if (!supportsTripWaypoint(app)) {
    return buildStationNavigationUrl(app, station)
  }

  if (
    !isValidCoordinates(origin) ||
    !isValidCoordinates(destination) ||
    !isValidCoordinates(station)
  ) {
    return null
  }

  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', formatCoordinates(origin))
  url.searchParams.set('destination', formatCoordinates(destination))
  url.searchParams.set('waypoints', formatCoordinates(station))
  url.searchParams.set('travelmode', 'driving')
  return url.toString()
}
