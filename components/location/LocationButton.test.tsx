// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import LocationButton from './LocationButton'

vi.mock('../../lib/location/getCurrentPosition', () => ({
  getCurrentPosition: vi.fn(),
}))

const fetchMock = vi.fn()

function arrangeApiResponse(body: unknown, ok = true) {
  fetchMock.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

describe('LocationButton', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    arrangeApiResponse({ stations: [] })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the initial button, loading state, and resolved coordinates', async () => {
    let resolvePosition!: (
      position: Awaited<ReturnType<typeof getCurrentPosition>>,
    ) => void
    const positionPromise = new Promise<
      Awaited<ReturnType<typeof getCurrentPosition>>
    >((resolve) => {
      resolvePosition = resolve
    })

    vi.mocked(getCurrentPosition).mockReturnValue(positionPromise)
    render(<LocationButton />)

    const initialButton = screen.getByRole('button', {
      name: 'Usa la mia posizione',
    })

    expect(initialButton).toBeTruthy()

    fireEvent.click(initialButton)

    const loadingButton = screen.getByRole('button', {
      name: 'Ricerca posizione...',
    })

    expect(loadingButton).toBeTruthy()

    resolvePosition({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })

    expect(await screen.findByText('Posizione trovata')).toBeTruthy()
    expect(screen.getByText('latitude: 45.4642')).toBeTruthy()
    expect(screen.getByText('longitude: 9.19')).toBeTruthy()
    expect(screen.getByText('accuracy: 20')).toBeTruthy()
  })

  it('shows a readable error and re-enables the button', async () => {
    vi.mocked(getCurrentPosition).mockRejectedValue(
      new Error('Il permesso alla posizione è stato negato.'),
    )
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    const alert = await screen.findByRole('alert')
    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Usa la mia posizione',
    })

    expect(alert.textContent).toBe(
      'Il permesso alla posizione è stato negato.',
    )
    expect(button.disabled).toBe(false)
  })

  it('shows nearby stations with distance and available prices', async () => {
    vi.mocked(getCurrentPosition).mockResolvedValue({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })
    arrangeApiResponse({
      stations: [
        {
          id: 42,
          mimitId: 12_345,
          name: 'Stazione Centro',
          brand: 'Q8',
          address: 'Via Roma 1',
          city: 'Monza',
          province: 'MB',
          latitude: 45.47,
          longitude: 9.2,
          distanceMeters: 1_400,
          fuelPrice: 1.769,
          communicatedAt: '2026-08-11T08:30:00+00:00',
        },
        {
          id: 43,
          mimitId: 12_346,
          name: null,
          brand: 'IP',
          address: 'Corso Italia 2',
          city: 'Milano',
          province: 'MI',
          latitude: 45.48,
          longitude: 9.21,
          distanceMeters: 2_000,
          fuelPrice: null,
          communicatedAt: null,
        },
      ],
    })
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    expect(
      await screen.findByText('Stazione Centro - 1,4 km'),
    ).toBeTruthy()
    expect(screen.getByText('Q8')).toBeTruthy()
    expect(screen.getByText('Via Roma 1')).toBeTruthy()
    expect(screen.getByText('Milano')).toBeTruthy()
    expect(screen.getByText('1,769 €/L')).toBeTruthy()
    expect(screen.getByText('IP - 2,0 km')).toBeTruthy()
    expect(screen.getByText('Monza')).toBeTruthy()
    expect(screen.getByText('Prezzo non disponibile')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20',
    )
  })

  it('shows a message when no nearby stations are found', async () => {
    vi.mocked(getCurrentPosition).mockResolvedValue({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    expect(
      await screen.findByText('Nessun distributore trovato entro 15 km.'),
    ).toBeTruthy()
  })

  it('shows a readable error when the nearby stations API fails', async () => {
    vi.mocked(getCurrentPosition).mockResolvedValue({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })
    arrangeApiResponse({ error: 'Internal error' }, false)
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe(
      'Non è stato possibile trovare i distributori vicini. Riprova.',
    )
  })
})
