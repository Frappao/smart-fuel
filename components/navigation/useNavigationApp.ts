'use client'

import { useSyncExternalStore } from 'react'

import {
  isNavigationApp,
  type NavigationApp,
} from '../../lib/navigation/navigationApps'

/**
 * App di navigazione preferita, ricordata solo su questo dispositivo
 * (localStorage). Senza una scelta salvata: Apple Maps su iPhone, iPad e
 * Mac, Google Maps altrove.
 */
export const NAVIGATION_APP_STORAGE_KEY = 'rifornio_navigation_app_v1'

const listeners = new Set<() => void>()
let cachedApp: NavigationApp | null = null

function detectDefaultApp(): NavigationApp {
  const platform =
    typeof navigator === 'undefined'
      ? ''
      : `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`

  return /iPhone|iPad|iPod|Macintosh|MacIntel/i.test(platform)
    ? 'apple'
    : 'google'
}

function readStoredApp(): NavigationApp | null {
  try {
    const value = window.localStorage.getItem(NAVIGATION_APP_STORAGE_KEY)
    return isNavigationApp(value) ? value : null
  } catch {
    // localStorage non disponibile (navigazione privata).
    return null
  }
}

function getSnapshot(): NavigationApp {
  if (cachedApp === null) {
    cachedApp = readStoredApp() ?? detectDefaultApp()
  }
  return cachedApp
}

// Il server non conosce né il dispositivo né la scelta salvata.
function getServerSnapshot(): NavigationApp {
  return 'google'
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  function handleStorage(event: StorageEvent) {
    if (event.key !== NAVIGATION_APP_STORAGE_KEY) return
    cachedApp = null
    listener()
  }

  window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export function setNavigationApp(app: NavigationApp): void {
  cachedApp = app
  try {
    window.localStorage.setItem(NAVIGATION_APP_STORAGE_KEY, app)
  } catch {
    // Ignora: la scelta vale comunque per questa visita.
  }
  listeners.forEach((listener) => listener())
}

export function useNavigationApp(): NavigationApp {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Solo per i test: dimentica la scelta in memoria. */
export function resetNavigationAppCache(): void {
  cachedApp = null
}
