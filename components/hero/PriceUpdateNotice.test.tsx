// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

import PriceUpdateNotice from './PriceUpdateNotice'

const NOW = new Date('2026-11-10T09:00:00Z')
const fetchMock = vi.fn()

function respondWith(latestCommunicatedAt: string | null) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ latestCommunicatedAt }),
  })
}

describe('PriceUpdateNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('sostituisce la data della pagina statica con quella appena letta', async () => {
    respondWith('2026-11-09T08:03:30+00:00')

    render(<PriceUpdateNotice latestCommunicatedAt="2026-11-08T08:01:01+00:00" />)

    expect(screen.getByText('8 novembre 2026 alle ore 08:01')).toBeTruthy()
    expect(await screen.findByText('9 novembre 2026 alle ore 08:03')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/latest-price-update',
      expect.anything(),
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('non avvisa per il normale ritardo MIMIT (dati delle 8 del giorno prima)', async () => {
    // Mattina del 10, import di oggi non ancora eseguito: ultimo dato dell'8.
    respondWith('2026-11-08T08:01:01+00:00')

    render(<PriceUpdateNotice latestCommunicatedAt="2026-11-08T08:01:01+00:00" />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await Promise.resolve()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('avvisa se è saltato un intero giorno di import', async () => {
    respondWith('2026-11-07T08:01:00+00:00')

    render(<PriceUpdateNotice latestCommunicatedAt="2026-11-07T08:01:00+00:00" />)

    expect(screen.queryByRole('status')).toBeNull()
    expect((await screen.findByRole('status')).textContent).toMatch(
      /più di 3 giorni/,
    )
  })

  it('tiene la data della pagina se la rilettura fallisce', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    render(<PriceUpdateNotice latestCommunicatedAt="2026-11-06T08:00:00+00:00" />)

    expect((await screen.findByRole('status')).textContent).toMatch(
      /più di 3 giorni/,
    )
    expect(screen.getByText('6 novembre 2026 alle ore 08:00')).toBeTruthy()
  })

  it('non mostra nulla se la data non è disponibile', async () => {
    respondWith(null)

    const { container } = render(<PriceUpdateNotice latestCommunicatedAt={null} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
