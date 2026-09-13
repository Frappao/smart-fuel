'use client'

import { useEffect, useRef } from 'react'

const bannerScriptUrl =
  'https://www.highrevenueformat.com/2bb0b23d54c197410ffcb72321748ea6/invoke.js'
const bannerScriptId = 'rifornio-adsterra-banner'

interface AdsterraBannerOptions {
  key: '2bb0b23d54c197410ffcb72321748ea6'
  format: 'iframe'
  height: 250
  width: 300
  params: Record<string, never>
}

declare global {
  interface Window {
    atOptions?: AdsterraBannerOptions
  }
}

export default function AdSlot() {
  const slotRef = useRef<HTMLElement>(null)
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'

  useEffect(() => {
    const slot = slotRef.current

    if (!adsEnabled || !slot || document.getElementById(bannerScriptId)) {
      return
    }

    const script = document.createElement('script')
    const bannerOptions: AdsterraBannerOptions = {
      key: '2bb0b23d54c197410ffcb72321748ea6',
      format: 'iframe',
      height: 250,
      width: 300,
      params: {},
    }

    window.atOptions = bannerOptions
    script.id = bannerScriptId
    script.async = false
    script.src = bannerScriptUrl
    script.addEventListener('error', () => script.remove(), { once: true })
    slot.appendChild(script)

    return () => {
      script.remove()
      slot.replaceChildren()

      if (window.atOptions === bannerOptions) {
        delete window.atOptions
      }
    }
  }, [adsEnabled])

  if (!adsEnabled) {
    return null
  }

  return (
    <aside
      ref={slotRef}
      aria-label="Banner pubblicitario 300x250"
      className="flex min-h-[250px] min-w-0 w-[300px] max-w-full self-center items-center justify-center overflow-hidden"
    />
  )
}
