'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

import type { SearchMode } from '../../lib/account/accountPreferences'
import { useVehicleAccount } from '../account/VehicleAccount'
import TripCalculator from '../trip/TripCalculator'
import FuelSmartCalculator from './FuelSmartCalculator'

export default function FuelSearchCalculator() {
  const preferredMode = useVehicleAccount()?.preferences.searchMode ?? null
  const [mode, setMode] = useState<SearchMode>(preferredMode ?? 'nearby')
  const [lastPreferredMode, setLastPreferredMode] = useState(preferredMode)

  // Modalità iniziale scelta nell'account: si applica quando la preferenza
  // arriva o cambia, poi l'utente resta libero di passare all'altra.
  if (preferredMode !== lastPreferredMode) {
    setLastPreferredMode(preferredMode)
    if (preferredMode) setMode(preferredMode)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <div
        aria-label="Tipo di ricerca"
        className="relative grid grid-cols-2 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-1.5 shadow-inner"
        role="group"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-zinc-800/90 border border-zinc-700/60 shadow-md"
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
          className="relative z-10 min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] aria-pressed:text-emerald-400 text-zinc-400 hover:text-zinc-200"
          type="button"
          onClick={() => setMode('nearby')}
        >
          Vicino a me
        </button>
        <button
          aria-pressed={mode === 'trip'}
          className="relative z-10 min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] aria-pressed:text-emerald-400 text-zinc-400 hover:text-zinc-200"
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
