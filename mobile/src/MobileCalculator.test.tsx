// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMobileCurrentPosition } from './location/getMobileCurrentPosition'
import MobileCalculator from './MobileCalculator'
import { openStationNavigation } from './navigation/openStationNavigation'

vi.mock('./location/getMobileCurrentPosition', () => ({
  getMobileCurrentPosition: vi.fn(),
}))

vi.mock('./navigation/openStationNavigation', () => ({
  openStationNavigation: vi.fn(),
}))

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
    vi.mocked(getMobileCurrentPosition).mockResolvedValue({
      latitude: 41.9028,
      longitude: 12.4964,
      accuracy: 18,
    })
    vi.mocked(openStationNavigation).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('requests location only after submit and shows a loading state', () => {
    vi.mocked(getMobileCurrentPosition).mockReturnValue(new Promise(() => {}))
    render(<MobileCalculator />)

    expect(getMobileCurrentPosition).not.toHaveBeenCalled()
    expect(screen.queryByText(/Posizione di test/)).toBeNull()

    submitForm()

    expect(getMobileCurrentPosition).toHaveBeenCalledOnce()
    expect(
      screen.getByText('Sto cercando i distributori più convenienti...'),
    ).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
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
          latitude: 41.91,
          longitude: 12.49,
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
          latitude: 41.89,
          longitude: 12.51,
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
          latitude: 41.9,
          longitude: 12.52,
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
          latitude: 41.905,
          longitude: 12.495,
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
      'https://rifornio.it/api/nearby-stations?lat=41.9028&lng=12.4964&radius=15000&limit=20&fuelType=Gasolio&isSelf=false',
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
      origin: { latitude: 41.9028, longitude: 12.4964 },
      destinations: [
        { latitude: 41.91, longitude: 12.49 },
        { latitude: 41.89, longitude: 12.51 },
        { latitude: 41.9, longitude: 12.52 },
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

    const requestCountBeforeNavigation = fetchMock.mock.calls.length
    const navigationButtons = screen.getAllByRole('button', {
      name: 'Apri nel navigatore',
    })

    expect(navigationButtons).toHaveLength(2)
    fireEvent.click(navigationButtons[0])

    expect(openStationNavigation).toHaveBeenCalledWith({
      latitude: 41.91,
      longitude: 12.49,
    })
    expect(getMobileCurrentPosition).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledTimes(requestCountBeforeNavigation)
    expect(
      screen.getAllByRole('heading', { level: 3 }).map(({ textContent }) =>
        textContent,
      ),
    ).toEqual(['1. Near Expensive', '2. Far Cheap'])

    vi.mocked(openStationNavigation).mockRejectedValueOnce(
      new Error('raw plugin error'),
    )
    fireEvent.click(navigationButtons[1])

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Non riesco ad aprire il navigatore. Riprova.',
    )
    expect(fetchMock).toHaveBeenCalledTimes(requestCountBeforeNavigation)
  })

  it('uses the newly selected fuel type on consecutive submissions', async () => {
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'Benzina Station',
          brand: null,
          address: null,
          city: 'Roma',
          province: 'RM',
          latitude: 41.91,
          longitude: 12.49,
          distanceMeters: 1_000,
          fuelPrice: 2.007,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({
      routes: [
        { destinationIndex: 0, distanceMeters: 1_000, durationSeconds: 300 },
      ],
    })
    arrangeResponse({
      stations: [
        {
          id: 1,
          mimitId: 101,
          name: 'Gasolio Station',
          brand: null,
          address: null,
          city: 'Roma',
          province: 'RM',
          latitude: 41.91,
          longitude: 12.49,
          distanceMeters: 1_000,
          fuelPrice: 2.077,
          communicatedAt: null,
        },
      ],
    })
    arrangeResponse({
      routes: [
        { destinationIndex: 0, distanceMeters: 1_000, durationSeconds: 300 },
      ],
    })
    render(<MobileCalculator />)

    submitForm({ fuelType: 'Benzina', serviceMode: 'true' })
    expect(await screen.findByText('1. Benzina Station')).toBeTruthy()

    submitForm({ fuelType: 'Gasolio', serviceMode: 'true' })
    expect(await screen.findByText('1. Gasolio Station')).toBeTruthy()

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://rifornio.it/api/nearby-stations?lat=41.9028&lng=12.4964&radius=15000&limit=20&fuelType=Benzina&isSelf=true',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://rifornio.it/api/nearby-stations?lat=41.9028&lng=12.4964&radius=15000&limit=20&fuelType=Gasolio&isSelf=true',
    )
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

  it.each([
    [
      'permission denied',
      "Per trovare i distributori vicini devi consentire l'accesso alla posizione.",
    ],
    [
      'position unavailable',
      'Non riesco a determinare la tua posizione. Controlla i servizi di localizzazione e riprova.',
    ],
    ['timeout', 'La posizione sta impiegando troppo tempo. Riprova.'],
    [
      'unknown error',
      'Non è stato possibile recuperare la posizione. Riprova.',
    ],
  ])('shows a readable %s error without calling APIs', async (_, message) => {
    vi.mocked(getMobileCurrentPosition).mockRejectedValueOnce(
      new Error(message),
    )
    render(<MobileCalculator />)

    submitForm()

    expect((await screen.findByRole('alert')).textContent).toBe(message)
    expect(fetchMock).not.toHaveBeenCalled()
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
