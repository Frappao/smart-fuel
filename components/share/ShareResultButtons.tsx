'use client'

import { useState } from 'react'

import { trackEvent } from '../../lib/analytics/trackEvent'

interface ShareResultButtonsProps {
  stationName: string
  brand: string | null
  city: string | null
  fuelPrice: number
  netFuelLiters: number
  fuelType: string
  isSelf: boolean
  refuelAmount: number
  className?: string
}

export function buildShareUrl(params: {
  stationName: string
  brand: string | null
  city: string | null
  fuelPrice: number
  netFuelLiters: number
  fuelType: string
  isSelf: boolean
  refuelAmount: number
}): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://rifornio.it'

  const searchParams = new URLSearchParams({
    condividi: '1',
    nome: params.stationName,
    prezzo: params.fuelPrice.toFixed(3),
    carburante: params.fuelType,
    self: params.isSelf ? '1' : '0',
    importo: String(params.refuelAmount),
    litri: params.netFuelLiters.toFixed(2),
  })

  if (params.city) searchParams.set('citta', params.city)
  if (params.brand) searchParams.set('marchio', params.brand)

  return `${origin}/?${searchParams.toString()}`
}

export function buildWhatsAppMessage(params: {
  stationName: string
  city: string | null
  fuelPrice: number
  netFuelLiters: number
  fuelType: string
  refuelAmount: number
  shareUrl: string
}): string {
  const citySuffix = params.city ? ` (${params.city})` : ''
  const formattedPrice = params.fuelPrice.toLocaleString('it-IT', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  const formattedLiters = params.netFuelLiters.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return [
    '⛽ Ho trovato dove conviene davvero fare il pieno con Rifornio:',
    `📍 ${params.stationName}${citySuffix}`,
    `💰 ${formattedPrice} €/L (${params.fuelType})`,
    `🚗 Con ${params.refuelAmount}€ restano ${formattedLiters} L netti effettivi dopo il viaggio!`,
    '',
    `Controlla se conviene anche per la tua auto: ${params.shareUrl}`,
  ].join('\n')
}

export default function ShareResultButtons({
  stationName,
  brand,
  city,
  fuelPrice,
  netFuelLiters,
  fuelType,
  isSelf,
  refuelAmount,
  className = '',
}: ShareResultButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = buildShareUrl({
    stationName,
    brand,
    city,
    fuelPrice,
    netFuelLiters,
    fuelType,
    isSelf,
    refuelAmount,
  })

  const whatsAppText = buildWhatsAppMessage({
    stationName,
    city,
    fuelPrice,
    netFuelLiters,
    fuelType,
    refuelAmount,
    // Canale "condivisione su WhatsApp" secondo docs/utm.md: GA4 lo
    // classifica come social grazie a utm_medium=social.
    shareUrl: `${shareUrl}&utm_source=whatsapp&utm_medium=social&utm_campaign=condivisione_risultato`,
  })

  const whatsAppHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`

  function trackShare(method: 'whatsapp' | 'copy_link') {
    trackEvent('share_calculation', {
      method,
      fuel_type: fuelType,
      station_name: stationName,
    })
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      trackShare('copy_link')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <div
      aria-label="Condividi questo risultato"
      className={`mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80 ${className}`.trim()}
    >
      <span className="text-xs font-medium text-zinc-400 mr-1">
        Consiglia a un amico:
      </span>

      {/* WhatsApp Button */}
      <a
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackShare('whatsapp')}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 fill-current text-[#25D366]"
          viewBox="0 0 24 24"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.35.06-.53.25-.19.19-.71.69-.71 1.69s.73 1.96.83 2.1c.1.13 1.41 2.16 3.43 3.03.48.21.86.33 1.15.43.48.15.93.13 1.28.08.39-.06 1.21-.49 1.38-.97.17-.48.17-.89.12-.97-.05-.08-.19-.13-.39-.23s-1.21-.6-1.4-.66c-.19-.07-.32-.1-.46.1-.14.19-.53.66-.65.8-.12.13-.24.15-.44.05-.2-.1-.85-.31-1.63-1-.6-.54-1.01-1.2-1.13-1.4-.12-.2-.01-.31.09-.41.09-.09.2-.24.3-.35.1-.12.13-.2.2-.34.07-.13.03-.25-.02-.35-.05-.1-.46-1.11-.63-1.52-.17-.41-.34-.35-.46-.36l-.39-.01z" />
        </svg>
        <span>Condividi su WhatsApp</span>
      </a>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {copied ? (
          <>
            <svg
              aria-hidden="true"
              className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              Link copiato!
            </span>
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="size-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>Copia link</span>
          </>
        )}
      </button>
    </div>
  )
}
