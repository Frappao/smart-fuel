'use client'

import { useState } from 'react'

import TripCalculator from '../trip/TripCalculator'
import FuelSmartCalculator from './FuelSmartCalculator'

type SearchMode = 'nearby' | 'trip'

export default function FuelSearchCalculator() {
  const [mode, setMode] = useState<SearchMode>('nearby')

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div
        aria-label="Tipo di ricerca"
        className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-200 p-1 dark:bg-zinc-800"
        role="group"
      >
        <button
          aria-pressed={mode === 'nearby'}
          className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold aria-pressed:bg-white aria-pressed:text-emerald-700 aria-pressed:shadow-sm dark:aria-pressed:bg-zinc-950 dark:aria-pressed:text-emerald-300"
          type="button"
          onClick={() => setMode('nearby')}
        >
          Vicino a me
        </button>
        <button
          aria-pressed={mode === 'trip'}
          className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold aria-pressed:bg-white aria-pressed:text-emerald-700 aria-pressed:shadow-sm dark:aria-pressed:bg-zinc-950 dark:aria-pressed:text-emerald-300"
          type="button"
          onClick={() => setMode('trip')}
        >
          Lungo un percorso
        </button>
      </div>
      {mode === 'nearby' ? <FuelSmartCalculator /> : <TripCalculator />}
    </div>
  )
}
