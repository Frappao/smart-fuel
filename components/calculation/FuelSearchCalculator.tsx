'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

import TripCalculator from '../trip/TripCalculator'
import FuelSmartCalculator from './FuelSmartCalculator'

type SearchMode = 'nearby' | 'trip'

export default function FuelSearchCalculator() {
  const [mode, setMode] = useState<SearchMode>('nearby')

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div
        aria-label="Tipo di ricerca"
        className="relative grid grid-cols-2 rounded-2xl bg-zinc-200/80 p-1.5 dark:bg-zinc-800/80"
        role="group"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-xs dark:bg-zinc-950"
          initial={false}
          animate={{
            x: mode === 'nearby' ? '0%' : '100%',
          }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 260,
          }}
        />
        <button
          aria-pressed={mode === 'nearby'}
          className="relative z-10 min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] aria-pressed:text-emerald-700 text-zinc-600 hover:text-zinc-900 dark:aria-pressed:text-emerald-300 dark:text-zinc-400 dark:hover:text-zinc-100"
          type="button"
          onClick={() => setMode('nearby')}
        >
          Vicino a me
        </button>
        <button
          aria-pressed={mode === 'trip'}
          className="relative z-10 min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] aria-pressed:text-emerald-700 text-zinc-600 hover:text-zinc-900 dark:aria-pressed:text-emerald-300 dark:text-zinc-400 dark:hover:text-zinc-100"
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
