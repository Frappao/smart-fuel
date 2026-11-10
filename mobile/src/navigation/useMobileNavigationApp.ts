import { Capacitor } from '@capacitor/core'

import {
  setNavigationApp,
  useNavigationApp,
} from '../../../components/navigation/useNavigationApp'
import {
  NAVIGATION_APPS,
  type NavigationApp,
} from '../../../lib/navigation/navigationApps'

/** Apple Maps esiste solo su iOS: su Android resterebbe la versione web. */
export function getAvailableNavigationApps(
  platform: string = Capacitor.getPlatform(),
): NavigationApp[] {
  return platform === 'ios'
    ? [...NAVIGATION_APPS]
    : NAVIGATION_APPS.filter((app) => app !== 'apple')
}

/**
 * App di navigazione scelta, ricordata sul dispositivo con la stessa chiave
 * localStorage del sito. Una scelta non disponibile qui diventa Google Maps.
 */
export function useMobileNavigationApp(): {
  app: NavigationApp
  apps: NavigationApp[]
  setApp: (app: NavigationApp) => void
} {
  const storedApp = useNavigationApp()
  const apps = getAvailableNavigationApps()

  return {
    app: apps.includes(storedApp) ? storedApp : 'google',
    apps,
    setApp: setNavigationApp,
  }
}
