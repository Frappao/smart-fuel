// MIMIT pubblica ogni mattina (~8:45) i prezzi in vigore alle 8 del giorno
// PRIMA: il dato più recente ha quindi già ~25 ore appena importato e arriva
// a ~49 ore subito prima dell'import successivo. Sotto le 72 ore è la
// normalità; oltre significa che è saltato almeno un giorno di import.
export const STALE_PRICES_AFTER_HOURS = 72

export interface PriceUpdateStatus {
  label: string
  isStale: boolean
}

// communicated_at contiene l'orario MIMIT (ora italiana) salvato senza fuso:
// lo formattiamo in UTC per mostrare esattamente l'orario comunicato.
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

export function getPriceUpdateStatus(
  latestCommunicatedAt: string | null,
  now: Date = new Date(),
): PriceUpdateStatus | null {
  if (!latestCommunicatedAt) {
    return null
  }

  const timestamp = Date.parse(latestCommunicatedAt)

  if (!Number.isFinite(timestamp)) {
    return null
  }

  const ageHours = (now.getTime() - timestamp) / 3_600_000

  return {
    label: DATE_TIME_FORMAT.format(timestamp),
    isStale: ageHours > STALE_PRICES_AFTER_HOURS,
  }
}
