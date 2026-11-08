'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'

// Vercel Web Analytics: statistiche aggregate senza cookie e senza
// identificativi persistenti (il visitatore è un hash della richiesta scartato
// dopo 24 ore). Indipendente dal consenso di Google Analytics.
//
// Dell'URL inviamo solo il percorso e i parametri utili a capire da dove
// arrivano le visite: tutto il resto della query string viene scartato.
const ALLOWED_QUERY_PARAMS = new Set([
  'condividi',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
])

export function redactAnalyticsUrl(rawUrl: string): string {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  const keptParams = new URLSearchParams()
  url.searchParams.forEach((value, key) => {
    if (ALLOWED_QUERY_PARAMS.has(key)) {
      keptParams.append(key, value)
    }
  })

  url.search = keptParams.toString()
  url.hash = ''

  return url.toString()
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: redactAnalyticsUrl(event.url) }
}

export default function VercelWebAnalytics() {
  return <Analytics beforeSend={beforeSend} />
}
