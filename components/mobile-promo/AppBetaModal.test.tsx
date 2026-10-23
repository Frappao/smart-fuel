// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBetaButton, AppBetaProvider } from './AppBetaModal'

describe('AppBetaModal', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.setItem('rifornio_app_promo_dismissed_v1', '1')
  })

  afterEach(() => {
    cleanup()
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
})
