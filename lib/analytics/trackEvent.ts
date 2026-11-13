import type { NavigationApp } from '../navigation/navigationApps'
import { hasAnalyticsConsent } from './consent'

/**
 * Unico punto da cui partono gli eventi di prodotto.
 *
 * - Va a Google Analytics 4 solo se l'utente ha accettato Analytics e gtag è
 *   caricato; altrimenti non fa nulla (anche nell'app Capacitor, che oggi non
 *   ha un sistema di misurazione).
 * - Vercel Web Analytics non riceve eventi: sul piano attuale gli eventi
 *   personalizzati non sono disponibili. Se il piano cambia, l'invio va
 *   aggiunto qui con `track` di @vercel/analytics.
 * - I parametri sono fissati per tipo: mai coordinate, indirizzi, email o
 *   altri dati che identificano la persona.
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export type SearchMode = 'nearby' | 'trip'
export type ServiceMode = 'self' | 'servito'
export type AppPlatform = 'android' | 'ios'

interface StationEventParams {
  search_mode: SearchMode
  rank: number
  city?: string | null
  brand?: string | null
}

export interface AnalyticsEvents {
  search_performed: {
    search_mode: SearchMode
    fuel_type: string
    service: ServiceMode
    results_count: number
    /** Comune del distributore più conveniente, se c'è un risultato. */
    city?: string | null
  }
  station_viewed: StationEventParams & {
    view_source: 'map' | 'list' | 'calculation_details'
  }
  navigation_started: StationEventParams & {
    navigation_app: NavigationApp
  }
  vehicle_set: {
    vehicle_source: 'manual' | 'saved_vehicle'
    fuel_type: string
    consumption_unit: string
    consumption_band: string
  }
  app_download_click: {
    placement: 'header' | 'inline_offer'
    destination: 'beta_waitlist' | 'google_play'
  }
  app_waitlist_signup: {
    platform: AppPlatform
  }
  share_calculation: {
    method: 'whatsapp' | 'copy_link'
    fuel_type: string
    station_name: string
  }
}

export type AnalyticsEventName = keyof AnalyticsEvents

type ParamValue = string | number | boolean

// Limite di GA4 per il valore di un parametro.
const MAX_PARAM_LENGTH = 100

export function sanitizeEventParams(
  params: object,
): Record<string, ParamValue> {
  const clean: Record<string, ParamValue> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const trimmed = value.trim().slice(0, MAX_PARAM_LENGTH)
      if (trimmed !== '') clean[key] = trimmed
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) clean[key] = value
    } else if (typeof value === 'boolean') {
      clean[key] = value
    }
  }

  return clean
}

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  params: AnalyticsEvents[Name],
): void {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') return

  try {
    window.gtag('event', name, sanitizeEventParams(params))
  } catch {
    // La misurazione non deve mai rompere l'interfaccia.
  }
}

/** Fascia di consumo in L/100 km: abbastanza per capire il pubblico, mai il valore esatto. */
export function getConsumptionBand(litersPer100Km: number): string {
  if (!Number.isFinite(litersPer100Km) || litersPer100Km <= 0) return 'sconosciuto'
  if (litersPer100Km < 5) return 'meno di 5'
  if (litersPer100Km < 7) return '5-7'
  if (litersPer100Km < 9) return '7-9'
  if (litersPer100Km < 12) return '9-12'
  return '12 e oltre'
}
