'use client'

import { useEffect, useState } from 'react'

import { getPriceUpdateStatus } from './priceUpdateStatus'

interface PriceUpdateNoticeProps {
  /** Valore reso dal server (ISR): può essere vecchio di ore. */
  latestCommunicatedAt: string | null
}

interface NoticeState {
  latestCommunicatedAt: string | null
  /** null finché il browser non ha riletto la data: niente avviso prima. */
  checkedAt: Date | null
}

const LATEST_PRICE_UPDATE_ENDPOINT = '/api/latest-price-update'

async function fetchLatestCommunicatedAt(
  signal: AbortSignal,
): Promise<string | null> {
  const response = await fetch(LATEST_PRICE_UPDATE_ENDPOINT, { signal })

  if (!response.ok) {
    return null
  }

  const body: unknown = await response.json()
  const value = (body as { latestCommunicatedAt?: unknown } | null)
    ?.latestCommunicatedAt

  return typeof value === 'string' ? value : null
}

export default function PriceUpdateNotice({
  latestCommunicatedAt: initialLatestCommunicatedAt,
}: PriceUpdateNoticeProps) {
  const [state, setState] = useState<NoticeState>({
    latestCommunicatedAt: initialLatestCommunicatedAt,
    checkedAt: null,
  })

  // La pagina è statica (ISR): la data resa dal server e soprattutto il
  // confronto con "adesso" risalgono all'ultima rigenerazione. Li rileggiamo
  // nel browser così l'avviso riflette sempre l'ultimo import.
  useEffect(() => {
    const controller = new AbortController()

    fetchLatestCommunicatedAt(controller.signal)
      .catch(() => null)
      .then((latest) => {
        if (controller.signal.aborted) {
          return
        }

        setState((current) => ({
          latestCommunicatedAt: latest ?? current.latestCommunicatedAt,
          checkedAt: new Date(),
        }))
      })

    return () => controller.abort()
  }, [])

  const status = getPriceUpdateStatus(
    state.latestCommunicatedAt,
    state.checkedAt ?? undefined,
  )

  if (!status) {
    return null
  }

  return (
    <div className="space-y-1 text-xs leading-5">
      <p className="text-zinc-400">
        Prezzi aggiornati al{' '}
        <time
          dateTime={state.latestCommunicatedAt ?? undefined}
          className="tabular-nums text-zinc-400"
          suppressHydrationWarning
        >
          {status.label}
        </time>{' '}
        · fonte MIMIT
      </p>
      {state.checkedAt && status.isStale ? (
        <p role="status" className="text-amber-300/80">
          I prezzi potrebbero non essere aggiornati: l&apos;ultimo dato ricevuto
          risale a più di 3 giorni fa.
        </p>
      ) : null}
    </div>
  )
}
