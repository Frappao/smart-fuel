'use client'

import React from 'react'

/**
 * HeroConvenienceVisual
 * 
 * Replaces the old 3D nozzle with a clear, elegant visual comparison
 * illustrating Rifornio's core value proposition:
 * Net Liters = Liters Purchased - Travel Fuel Consumed.
 */
export default function HeroConvenienceVisual() {
  return (
    <div
      aria-label="Esempio visivo di convenienza reale"
      className="w-full max-w-sm rounded-3xl border border-zinc-800/90 bg-zinc-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-2xl transition-all duration-200 hover:border-zinc-700/80"
    >
      {/* Header with pill */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-400">
            ⚖️
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Come decide Rifornio
          </span>
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          Litri Netti
        </span>
      </div>

      {/* Comparison cards */}
      <div className="mt-3.5 space-y-2.5">
        {/* Farther Station (Lower pump price, but lost in travel) */}
        <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-3 transition hover:border-zinc-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-400">Distributore lontano</span>
            <span className="rounded-md bg-zinc-800/70 px-1.5 py-0.5 font-bold text-zinc-200 tabular-nums">
              1,74 €/L <span className="text-[10px] font-normal text-emerald-400">(-4¢)</span>
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
            <span>🚗 16 km A/R (-1,1 L viaggio)</span>
            <span className="font-semibold text-zinc-300 tabular-nums">27,6 L netti</span>
          </div>

          {/* Visual bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-500"
              style={{ width: '88%' }}
              title="27,6 Litri netti stimati"
            />
          </div>
        </div>

        {/* Closer Station (Standard pump price, but wins in tank) */}
        <div className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <span>Distributore vicino</span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wide text-emerald-300">
                VINCE
              </span>
            </div>
            <span className="rounded-md bg-emerald-950/60 px-1.5 py-0.5 font-bold text-zinc-100 tabular-nums">
              1,78 €/L
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-300/90">
            <span>📍 2 km A/R (-0,1 L viaggio)</span>
            <span className="font-bold text-emerald-300 tabular-nums">28,0 L netti</span>
          </div>

          {/* Visual bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-950/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 shadow-xs shadow-emerald-400/50"
              style={{ width: '96%' }}
              title="28,0 Litri netti stimati"
            />
          </div>
        </div>
      </div>

      {/* Insight takeaway */}
      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2 text-center text-[11px] leading-relaxed text-zinc-400">
        <span className="font-bold text-emerald-300">+0,4 L nel serbatoio</span>:{' '}
        il prezzo al litro era più alto, ma non hai sprecato carburante per raggiungerlo.
      </div>
    </div>
  )
}
