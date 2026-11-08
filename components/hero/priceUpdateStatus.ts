export const STALE_PRICES_AFTER_HOURS = 48

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
