'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { RoadSignPrice } from '../calculation/RoadSignPrice'

function SharedStationBannerInner() {
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)

  const isShared = searchParams?.get('condividi') === '1'
  const stationName = searchParams?.get('nome')
  const city = searchParams?.get('citta')
  const brand = searchParams?.get('marchio')
  const rawPrice = searchParams?.get('prezzo')
  const fuelType = searchParams?.get('carburante') || 'Benzina'
  const isSelf = searchParams?.get('self') !== '0'
  const refuelAmount = searchParams?.get('importo') || '50'
  const netLiters = searchParams?.get('litri')

  const fuelPrice = rawPrice ? parseFloat(rawPrice) : null

  if (dismissed || !isShared || !stationName || fuelPrice === null || Number.isNaN(fuelPrice)) {
    return null
  }

  return (
    <section
      aria-label="Consiglio di un amico"
      className="relative rounded-2xl border-2 border-emerald-600/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-4 sm:p-5 shadow-sm dark:border-emerald-500/80 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow">
            ⛽
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 uppercase tracking-wide dark:bg-emerald-900/60 dark:text-emerald-200">
            Consiglio di un amico
          </span>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Chiudi banner consiglio"
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-900 sm:text-lg dark:text-zinc-100">
            {stationName} {city ? `(${city})` : ''}
          </h2>
          {brand && brand !== stationName ? (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Marchio: {brand}
            </p>
          ) : null}
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Prezzo segnalato:
          </span>
          <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
            <RoadSignPrice price={fuelPrice} /> <span className="text-xs font-semibold">€/L</span>
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
        Con un pieno da <strong>{refuelAmount} €</strong> di {fuelType} ({isSelf ? 'Self' : 'Servito'})
        {netLiters ? (
          <>
            {' '}restano circa <strong>{netLiters} L netti effettivi</strong> dopo il viaggio.
          </>
        ) : null}
      </p>

      <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-emerald-100/70 p-2.5 text-xs font-semibold text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-200">
        <span>👇</span>
        <span>
          Calcola subito con la tua posizione per scoprire se questo è il distributore più conveniente anche per te.
        </span>
      </div>
    </section>
  )
}

export default function SharedStationBanner() {
  return (
    <Suspense fallback={null}>
      <SharedStationBannerInner />
    </Suspense>
  )
}
