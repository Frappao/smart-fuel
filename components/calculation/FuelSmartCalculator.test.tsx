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
  fetchMock.mockResolvedValueOnce({
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
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 14_000,
          fuelPrice: 1.6,
        },
        {
          id: 2,
          name: 'Cheap Fuel',
          brand: 'Brand B',
          address: 'Via B',
          city: 'Milano',
          latitude: 45.45,
          longitude: 9.21,
          distanceMeters: 100,
          fuelPrice: 1.5,
        },
        {
          id: 3,
          name: 'Middle Station',
          brand: 'Brand C',
          address: 'Via C',
          city: 'Milano',
          latitude: 45.46,
          longitude: 9.22,
          distanceMeters: 50,
          fuelPrice: 1.4,
        },
        {
          id: 4,
          name: 'No Price',
          brand: 'Brand D',
          address: 'Via D',
          city: 'Milano',
          latitude: 45.465,
          longitude: 9.195,
          distanceMeters: 100,
          fuelPrice: null,
        },
        {
          id: 5,
          name: 'Invalid Coordinates',
          brand: 'Brand E',
          address: 'Via E',
          city: 'Milano',
          latitude: 95,
          longitude: 9.2,
          distanceMeters: 10,
          fuelPrice: 1,
        },
      ],
    })
    arrangeApiResponse({
      routes: [
        {
          destinationIndex: 1,
          distanceMeters: 20_000,
          durationSeconds: 900,
        },
        {
          destinationIndex: 0,
          distanceMeters: 1_000,
          durationSeconds: 300,
        },
        {
          destinationIndex: 99,
          distanceMeters: 500,
          durationSeconds: 60,
        },
        {
          destinationIndex: 2,
          distanceMeters: 'invalid',
          durationSeconds: 60,
        },
      ],
    })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(await screen.findByText('1. Near Expensive')).toBeTruthy()
    expect(getCurrentPosition).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/route-matrix')

    const routeMatrixRequest = fetchMock.mock.calls[1]?.[1] as RequestInit

    expect(routeMatrixRequest.method).toBe('POST')
    expect(JSON.parse(routeMatrixRequest.body as string)).toEqual({
      origin: { latitude: 45.4642, longitude: 9.19 },
      destinations: [
        { latitude: 45.47, longitude: 9.18 },
        { latitude: 45.45, longitude: 9.21 },
        { latitude: 45.46, longitude: 9.22 },
      ],
    })
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) =>
        heading.textContent,
      ),
    ).toEqual([
      '1. Near Expensive',
      '2. Cheap Fuel',
    ])

    const firstResult = screen.getByText('1. Near Expensive').closest('li')
    const secondResult = screen.getByText('2. Cheap Fuel').closest('li')

    expect(firstResult?.textContent).toContain(
      'Ti conviene questo distributore',
    )
    expect(firstResult?.textContent).toContain(
      'Distanza stradale stimata A/R: 2,0 km',
    )
    expect(firstResult?.textContent).toContain(
      'Litri stimati consumati per il viaggio: 0,20 L',
    )
    expect(firstResult?.textContent).toContain('Litri netti: 31,05 L')
    expect(secondResult?.textContent).toContain(
      'Distanza stradale stimata A/R: 40,0 km',
    )
    expect(secondResult?.textContent).toContain('Litri netti: 29,33 L')
    expect(screen.getAllByText('Ti conviene questo distributore')).toHaveLength(
      1,
    )
    expect(screen.queryByText(/Middle Station/)).toBeNull()
    expect(screen.queryByText(/No Price/)).toBeNull()
    expect(screen.queryByText(/Invalid Coordinates/)).toBeNull()
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

  it('shows a route matrix error without falling back to PostGIS', async () => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          name: 'PostGIS Candidate',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 100,
          fuelPrice: 1.5,
        },
      ],
    })
    arrangeApiResponse({ error: 'Google Routes unavailable' }, false)
    render(<FuelSmartCalculator />)

    submitForm()

    const alert = await screen.findByRole('alert')

    expect(alert.textContent).toBe(
      'Non è stato possibile recuperare le distanze stradali. Riprova.',
    )
    expect(screen.queryByText(/PostGIS Candidate/)).toBeNull()
  })

  it('shows an empty state when no candidate has a valid route', async () => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          name: 'Missing Route',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 100,
          fuelPrice: 1.5,
        },
      ],
    })
    arrangeApiResponse({ routes: [] })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(
      await screen.findByText('Nessun distributore classificabile.'),
    ).toBeTruthy()
    expect(screen.queryByText(/Missing Route/)).toBeNull()
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
