// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MobileCalculator from './MobileCalculator'

const fetchMock = vi.fn()

function arrangeResponse(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response)
}

function submitForm({
  fuelType = 'Benzina',
  serviceMode = 'true',
}: {
  fuelType?: 'Benzina' | 'Gasolio' | 'GPL'
  serviceMode?: 'true' | 'false'
} = {}) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Carburante' }), {
    target: { value: fuelType },
  })
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Modalità di servizio' }),
    { target: { value: serviceMode } },
  )
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

describe('MobileCalculator', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the temporary test position and a loading state on submit', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<MobileCalculator />)

    expect(
      screen.getByText('Posizione di test: Piazza del Duomo, Milano'),
    ).toBeTruthy()

    submitForm()

    expect(
      screen.getByText('Sto cercando i distributori più convenienti...'),
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://rifornio.it/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20&fuelType=Benzina&isSelf=true',
    )
  })

  it('uses Gasolio Servito and ranks routes by destinationIndex and net liters', async () => {
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'Near Expensive',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          province: 'MI',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 14_000,
          fuelPrice: 1.6,
          communicatedAt: null,
        },
        {
          id: 2,
          mimitId: 102,
          name: 'Far Cheap',
          brand: 'Brand B',
          address: 'Via B',
          city: 'Milano',
          province: 'MI',
          latitude: 45.45,
          longitude: 9.21,
          distanceMeters: 100,
          fuelPrice: 1.5,
          communicatedAt: null,
        },
        {
          id: 3,
          mimitId: 103,
          name: 'No Route',
          brand: 'Brand C',
          address: 'Via C',
          city: 'Milano',
          province: 'MI',
          latitude: 45.46,
          longitude: 9.22,
          distanceMeters: 50,
          fuelPrice: 1.4,
          communicatedAt: null,
        },
        {
          id: 4,
          mimitId: 104,
          name: 'No Price',
          brand: 'Brand D',
          address: 'Via D',
          city: 'Milano',
          province: 'MI',
          latitude: 45.465,
          longitude: 9.195,
          distanceMeters: 10,
          fuelPrice: null,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({
      routes: [
        { destinationIndex: 1, distanceMeters: 20_000, durationSeconds: 900 },
        { destinationIndex: 0, distanceMeters: 1_000, durationSeconds: 300 },
      ],
    })
    render(<MobileCalculator />)

    submitForm({ fuelType: 'Gasolio', serviceMode: 'false' })

    expect(await screen.findByText('1. Near Expensive')).toBeTruthy()
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://rifornio.it/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20&fuelType=Gasolio&isSelf=false',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://rifornio.it/api/route-matrix',
    )

    const routeRequest = fetchMock.mock.calls[1]?.[1] as RequestInit

    expect(routeRequest).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(JSON.parse(routeRequest.body as string)).toEqual({
      origin: { latitude: 45.4642, longitude: 9.19 },
      destinations: [
        { latitude: 45.47, longitude: 9.18 },
        { latitude: 45.45, longitude: 9.21 },
        { latitude: 45.46, longitude: 9.22 },
      ],
    })
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) =>
        textContent,
      ),
    ).toEqual(['1. Near Expensive', '2. Far Cheap'])

    const winner = screen.getByText('1. Near Expensive').closest('li')
    const second = screen.getByText('2. Far Cheap').closest('li')

    expect(winner?.textContent).toContain('Ti conviene questo distributore')
    expect(winner?.textContent).toContain('Distanza stradale stimata A/R2,0 km')
    expect(winner?.textContent).toContain('Litri netti31,05 L')
    expect(second?.textContent).toContain('Distanza stradale stimata A/R40,0 km')
    expect(second?.textContent).toContain('Litri netti29,33 L')
    expect(
      screen.getByText(
        'Hai circa 1,72 L netti in più rispetto al secondo classificato.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/No Route/)).toBeNull()
    expect(screen.queryByText(/No Price/)).toBeNull()
  })

  it('shows a fuel-specific empty state without requesting routes', async () => {
    arrangeResponse({ stations: [] })
    render(<MobileCalculator />)

    submitForm({ fuelType: 'GPL', serviceMode: 'false' })

    expect(
      await screen.findByText(
        'Non ho trovato distributori vicini con GPL Servito disponibile.',
      ),
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('shows a controlled nearby error', async () => {
    arrangeResponse({ error: 'internal detail' }, false, 500)
    render(<MobileCalculator />)

    submitForm()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Non riesco a cercare i distributori in questo momento. Riprova tra poco.',
    )
  })

  it('shows a controlled route error without using PostGIS as fallback', async () => {
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'PostGIS Candidate',
          brand: null,
          address: null,
          city: 'Milano',
          province: 'MI',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 100,
          fuelPrice: 1.5,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({ error: 'internal detail' }, false, 502)
    render(<MobileCalculator />)

    submitForm()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Non riesco a calcolare le distanze stradali in questo momento. Riprova tra poco.',
    )
    expect(screen.queryByText(/PostGIS Candidate/)).toBeNull()
  })

  it('handles a route matrix response without valid routes', async () => {
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'Missing Route',
          brand: null,
          address: null,
          city: 'Milano',
          province: 'MI',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 100,
          fuelPrice: 1.5,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({ routes: [] })
    render(<MobileCalculator />)

    submitForm()

    expect(
      await screen.findByText(
        'Ho trovato dei distributori, ma non posso confrontarli perché le distanze stradali non sono disponibili.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Missing Route/)).toBeNull()
  })

  it('shows the rate-limit message for a nearby stations HTTP 429', async () => {
    arrangeResponse({ error: 'rate limit' }, false, 429)
    render(<MobileCalculator />)
    submitForm()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Hai effettuato troppe richieste in poco tempo. Attendi un minuto e riprova.',
    )
  })

  it('shows the rate-limit message for a route matrix HTTP 429', async () => {
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'Candidate',
          brand: null,
          address: null,
          city: 'Milano',
          province: 'MI',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 100,
          fuelPrice: 1.5,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({ error: 'rate limit' }, false, 429)
    render(<MobileCalculator />)
    submitForm()

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Hai effettuato troppe richieste in poco tempo. Attendi un minuto e riprova.',
    )
  })
})
