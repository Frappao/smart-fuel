// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import FuelSmartCalculator from './FuelSmartCalculator'

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

function submitForm() {
  fireEvent.change(
    screen.getByRole('spinbutton', {
      name: 'Importo rifornimento in euro',
    }),
    { target: { value: '50' } },
  )
  fireEvent.change(
    screen.getByRole('spinbutton', {
      name: 'Consumo medio auto in L/100 km',
    }),
    { target: { value: '10' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
}

describe('FuelSmartCalculator', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.mocked(getCurrentPosition).mockResolvedValue({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('submits the form and ranks priced stations by net fuel liters', async () => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          name: 'Near Expensive',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          distanceMeters: 1_000,
          fuelPrice: 2,
        },
        {
          id: 2,
          name: 'Cheap Fuel',
          brand: 'Brand B',
          address: 'Via B',
          city: 'Milano',
          distanceMeters: 5_000,
          fuelPrice: 1.5,
        },
        {
          id: 3,
          name: 'Middle Station',
          brand: 'Brand C',
          address: 'Via C',
          city: 'Milano',
          distanceMeters: 2_000,
          fuelPrice: 1.8,
        },
        {
          id: 4,
          name: 'No Price',
          brand: 'Brand D',
          address: 'Via D',
          city: 'Milano',
          distanceMeters: 100,
          fuelPrice: null,
        },
      ],
    })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(await screen.findByText('1. Cheap Fuel')).toBeTruthy()
    expect(getCurrentPosition).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20',
    )
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) =>
        heading.textContent,
      ),
    ).toEqual([
      '1. Cheap Fuel',
      '2. Middle Station',
      '3. Near Expensive',
    ])

    const firstResult = screen.getByText('1. Cheap Fuel').closest('li')

    expect(firstResult?.textContent).toContain('Più conveniente')
    expect(screen.getAllByText('Più conveniente')).toHaveLength(1)
    expect(screen.queryByText(/No Price/)).toBeNull()
  })

  it('shows a readable API error', async () => {
    arrangeApiResponse({ error: 'Internal error' }, false)
    render(<FuelSmartCalculator />)

    submitForm()

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe(
      'Non è stato possibile recuperare i distributori vicini. Riprova.',
    )
  })

  it('shows a readable geolocation error without calling the API', async () => {
    vi.mocked(getCurrentPosition).mockRejectedValue(
      new Error('Il permesso alla posizione è stato negato.'),
    )
    render(<FuelSmartCalculator />)

    submitForm()

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe(
      'Il permesso alla posizione è stato negato.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
