// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SharedStationBanner from './SharedStationBanner'

const mockSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
}))

describe('SharedStationBanner', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing when no shared station parameters exist in URL', () => {
    mockSearchParams.mockReturnValue(new URLSearchParams(''))
    const { container } = render(<SharedStationBanner />)
    expect(container.textContent).toBe('')
  })

  it('renders the friendly greeting banner when opened from a shared link and allows dismissing it', () => {
    mockSearchParams.mockReturnValue(
      new URLSearchParams(
        'condividi=1&nome=Q8+Saronno&citta=Saronno&prezzo=1.759&carburante=Benzina&self=1&importo=50&litri=28.40',
      ),
    )

    render(<SharedStationBanner />)

    expect(screen.getByText(/Consiglio di un amico/i)).toBeTruthy()
    expect(screen.getByText(/Q8 Saronno \(Saronno\)/i)).toBeTruthy()
    expect(screen.getByText(/28.40 L netti effettivi/i)).toBeTruthy()

    const closeBtn = screen.getByRole('button', { name: /Chiudi banner consiglio/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByText(/Consiglio di un amico/i)).toBeNull()
  })
})
