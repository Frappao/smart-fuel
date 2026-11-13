/**
 * Scelta dell'utente su Google Analytics, ricordata nel localStorage.
 * Unica fonte di verità per il banner e per l'invio degli eventi: senza
 * "granted" nessun dato parte verso Google.
 */

export const CONSENT_KEY = 'rifornio-analytics-consent'
export const CONSENT_EVENT = 'rifornio-analytics-consent-change'

export type ConsentValue = 'granted' | 'denied'

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null

  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    // localStorage non disponibile: nessun consenso.
    return null
  }
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === 'granted'
}

function notifyConsentChange() {
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function saveConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // Ignora: la scelta vale comunque per questa visita.
  }
  notifyConsentChange()
}

/** Dimentica la scelta: il banner ricompare e si può decidere di nuovo. */
export function reopenConsentChoice(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY)
  } catch {
    // Ignora.
  }
  notifyConsentChange()
}

export function subscribeToConsent(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener(CONSENT_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CONSENT_EVENT, callback)
  }
}

function isGoogleAnalyticsCookie(name: string): boolean {
  return name === '_ga' || name.startsWith('_ga_') || name === '_gid' || name === '_gat'
}

/**
 * Cancella i cookie di Google Analytics dopo una revoca. GA li imposta sul
 * dominio più alto possibile (.rifornio.it), quindi proviamo ogni livello.
 */
export function deleteGoogleAnalyticsCookies(): void {
  if (typeof document === 'undefined') return

  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim() ?? '')
    .filter(isGoogleAnalyticsCookie)

  if (names.length === 0) return

  const hostParts = window.location.hostname.split('.')
  const domains: string[] = ['']
  for (let index = 0; index < hostParts.length - 1; index += 1) {
    domains.push(`.${hostParts.slice(index).join('.')}`)
  }

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}
