import { getPriceUpdateStatus } from './priceUpdateStatus'

interface PriceUpdateNoticeProps {
  latestCommunicatedAt: string | null
  now?: Date
}

export default function PriceUpdateNotice({
  latestCommunicatedAt,
  now,
}: PriceUpdateNoticeProps) {
  const status = getPriceUpdateStatus(latestCommunicatedAt, now)

  if (!status) {
    return null
  }

  return (
    <div className="space-y-1 text-xs leading-5">
      <p className="text-zinc-500">
        Prezzi aggiornati al{' '}
        <time dateTime={latestCommunicatedAt ?? undefined} className="tabular-nums text-zinc-400">
          {status.label}
        </time>{' '}
        · fonte MIMIT
      </p>
      {status.isStale ? (
        <p role="status" className="text-amber-300/80">
          I prezzi potrebbero non essere aggiornati: l&apos;ultimo dato ricevuto
          risale a più di 48 ore fa.
        </p>
      ) : null}
    </div>
  )
}
