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

  it('shows nearby stations and their distance in kilometers', async () => {
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
          name: null,
          brand: 'Q8',
          address: 'Via Roma 1',
          city: 'Milano',
          province: 'MI',
          latitude: 45.47,
          longitude: 9.2,
          distanceMeters: 1_400,
        },
      ],
    })
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    expect(await screen.findByText('Q8 - 1,4 km')).toBeTruthy()
    expect(screen.getByText('Via Roma 1')).toBeTruthy()
    expect(screen.getByText('Milano')).toBeTruthy()
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
