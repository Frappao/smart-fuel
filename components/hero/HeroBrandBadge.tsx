'use client'

import React from 'react'

/**
 * HeroBrandBadge (Opzione 1)
 *
 * Emblema in vetro scuro in stile Apple con bagliore smeraldo,
 * icona distributore carburante stilizzata e indicatore di stato attivo.
 */
export default function HeroBrandBadge() {
  return (
    <div
      aria-label="Rifornio — Risparmio reale carburanti"
      className="relative shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <div className="relative flex size-20 sm:size-24 items-center justify-center rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-zinc-800/90 to-zinc-950/90 p-3.5 shadow-2xl ring-1 ring-emerald-500/20 backdrop-blur-xl">
        {/* Subtle interior glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-2xl bg-emerald-500/10 blur-md"
        />

        {/* Stylized Fuel Station Vector Icon */}
        <svg
          aria-hidden="true"
          className="size-10 sm:size-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.45)] transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 22h12" />
          <path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          <path d="M7 6h4" />
          <path d="M7 9h4" />
          <circle cx="9" cy="15" r="1.5" fill="currentColor" />
        </svg>

        {/* Status spark indicator */}
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-zinc-950 shadow-sm shadow-emerald-400 animate-ping opacity-75"
        />
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-zinc-950"
        />
      </div>
    </div>
  )
}
