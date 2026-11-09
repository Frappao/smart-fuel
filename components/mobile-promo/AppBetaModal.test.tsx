// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { act } from '@testing-library/react'

import {
  AppBetaButton,
  AppBetaInlineOffer,
  AppBetaProvider,
} from './AppBetaModal'

describe('AppBetaModal', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.setItem('rifornio_app_promo_dismissed_v1', '1')
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens the modal, switches between Android and iPhone tabs, and submits the waitlist email', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    render(
      <AppBetaProvider>
        <AppBetaButton />
      </AppBetaProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /App/i }))

    expect(screen.getByText("È arrivata l'app Android")).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: /Ho un iPhone/i }))
    expect(screen.getByText("Sta arrivando l'app per iPhone")).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: /Ho un Android/i }))
    const emailInput = screen.getByPlaceholderText('nome@gmail.com')
    fireEvent.change(emailInput, { target: { value: 'tester@gmail.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Voglio provarla' }))

    expect(await screen.findByText(/Richiesta ricevuta!/i)).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/app-waitlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'tester@gmail.com',
          platform: 'android',
        }),
      }),
    )
  })

  it('never opens on its own, even after the analytics banner is answered', () => {
    vi.useFakeTimers()
    window.localStorage.clear()
    window.localStorage.setItem('rifornio-analytics-consent', 'denied')

    render(
      <AppBetaProvider>
        <AppBetaButton />
      </AppBetaProvider>,
    )
    act(() => {
      window.dispatchEvent(new Event('rifornio-analytics-consent-change'))
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows an inline offer that opens the modal or can be dismissed for good', () => {
    window.localStorage.clear()

    const { unmount } = render(
      <AppBetaProvider>
        <AppBetaInlineOffer />
      </AppBetaProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: "Prova l'app" }))
    expect(screen.getByText("È arrivata l'app Android")).toBeTruthy()
    unmount()
    window.localStorage.clear()

    render(
      <AppBetaProvider>
        <AppBetaInlineOffer />
      </AppBetaProvider>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: "Non mostrare più la proposta dell'app" }),
    )
    expect(screen.queryByRole('button', { name: "Prova l'app" })).toBeNull()
    expect(window.localStorage.getItem('rifornio_app_promo_dismissed_v1')).toBe('1')
  })
})
