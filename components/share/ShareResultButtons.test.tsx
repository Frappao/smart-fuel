// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ShareResultButtons, { buildShareUrl, buildWhatsAppMessage } from './ShareResultButtons'

describe('ShareResultButtons & Helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('builds a clean share URL without exposing sender GPS coordinates', () => {
    const url = buildShareUrl({
      stationName: 'Q8 Saronno',
      brand: 'Q8',
      city: 'Saronno',
      fuelPrice: 1.749,
      netFuelLiters: 28.4,
      fuelType: 'Benzina',
      isSelf: true,
      refuelAmount: 50,
    })

    expect(url).toContain('condividi=1')
    expect(url).toContain('nome=Q8+Saronno')
    expect(url).toContain('prezzo=1.749')
    expect(url).toContain('carburante=Benzina')
    expect(url).toContain('importo=50')
    expect(url).toContain('litri=28.40')
    expect(url).not.toContain('lat=')
    expect(url).not.toContain('lng=')
  })

  it('formats a compelling WhatsApp share message', () => {
    const msg = buildWhatsAppMessage({
      stationName: 'Eni Milano',
      city: 'Milano',
      fuelPrice: 1.699,
      netFuelLiters: 29.1,
      fuelType: 'Gasolio',
      refuelAmount: 50,
      shareUrl: 'https://rifornio.it/?condividi=1',
    })

    expect(msg).toContain('⛽ Ho trovato dove conviene davvero fare il pieno con Rifornio:')
    expect(msg).toContain('Eni Milano (Milano)')
    expect(msg).toContain('1,699 €/L')
    expect(msg).toContain('29,10 L netti')
    expect(msg).toContain('https://rifornio.it/?condividi=1')
  })

  it('renders WhatsApp and Copy Link buttons, triggering copy to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    })

    render(
      <ShareResultButtons
        stationName="Q8 Saronno"
        brand="Q8"
        city="Saronno"
        fuelPrice={1.749}
        netFuelLiters={28.4}
        fuelType="Benzina"
        isSelf={true}
        refuelAmount={50}
      />,
    )

    const whatsappLink = screen.getByRole('link', { name: /Condividi su WhatsApp/i })
    expect(whatsappLink.getAttribute('href')).toContain('api.whatsapp.com/send?text=')

    const copyBtn = screen.getByRole('button', { name: /Copia link/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledOnce()
    expect(await screen.findByText('Link copiato!')).toBeTruthy()
  })
})
