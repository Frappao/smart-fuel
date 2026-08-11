// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SupportedFuelType } from '../../lib/fuels/supportedFuelTypes'
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

function submitForm(
  fuelType: SupportedFuelType = 'Benzina',
  isSelf = true,
) {
  fireEvent.change(screen.getByRole('combobox', { name: 'Carburante' }), {
    target: { value: fuelType },
  })
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Modalità di servizio' }),
    { target: { value: String(isSelf) } },
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

  it('shows a clear loading message while calculating', () => {
    vi.mocked(getCurrentPosition).mockReturnValue(new Promise(() => {}))
    render(<FuelSmartCalculator />)

    submitForm()

    expect(
      screen.getByText('Sto cercando i distributori più convenienti...'),
    ).toBeTruthy()
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
      '/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20&fuelType=Benzina&isSelf=true',
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
    expect(
      screen.getByText(
        'Hai circa 1,72 L netti in più rispetto al secondo classificato.',
      ),
    ).toBeTruthy()
    expect(screen.getAllByText('Ti conviene questo distributore')).toHaveLength(
      1,
    )
    const navigationLinks = screen.getAllByRole('link', {
      name: 'Apri nel navigatore',
    })
    const winnerNavigationUrl = new URL(
      navigationLinks[0].getAttribute('href') ?? '',
    )

    expect(navigationLinks).toHaveLength(2)
    expect(winnerNavigationUrl.origin).toBe('https://www.google.com')
    expect(winnerNavigationUrl.pathname).toBe('/maps/dir/')
    expect(winnerNavigationUrl.searchParams.get('destination')).toBe(
      '45.47,9.18',
    )
    expect(winnerNavigationUrl.searchParams.get('api')).toBe('1')
    expect(winnerNavigationUrl.searchParams.get('travelmode')).toBe('driving')
    expect(winnerNavigationUrl.searchParams.get('dir_action')).toBe('navigate')
    expect(navigationLinks[0].getAttribute('target')).toBe('_blank')
    expect(navigationLinks[0].getAttribute('rel')).toBe('noopener noreferrer')
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
      'Non riesco a cercare i distributori in questo momento. Riprova tra poco.',
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
      'Non riesco a calcolare le distanze stradali in questo momento. Riprova tra poco.',
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
      await screen.findByText(
        'Ho trovato dei distributori, ma non posso confrontarli perché le distanze stradali non sono disponibili.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Missing Route/)).toBeNull()
  })

  it('shows a clear empty state when no Benzina Self candidate is available', async () => {
    arrangeApiResponse({ stations: [] })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(
      await screen.findByText(
        'Non ho trovato distributori vicini con Benzina Self disponibile.',
      ),
    ).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it.each([
    ['Gasolio', false],
    ['GPL', false],
  ] as const)(
    'searches %s in Servito mode and uses it in the empty state',
    async (fuelType, isSelf) => {
      arrangeApiResponse({ stations: [] })
      render(<FuelSmartCalculator />)

      submitForm(fuelType, isSelf)

      expect(
        await screen.findByText(
          `Non ho trovato distributori vicini con ${fuelType} Servito disponibile.`,
        ),
      ).toBeTruthy()
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/nearby-stations?lat=45.4642&lng=9.19&radius=15000&limit=20&fuelType=${fuelType}&isSelf=false`,
      )
      expect(fetchMock).toHaveBeenCalledOnce()
    },
  )

  it('does not show navigation when station coordinates are invalid', async () => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          name: 'Invalid Coordinates',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          latitude: null,
          longitude: 9.18,
          distanceMeters: 1_000,
          fuelPrice: 1.6,
        },
      ],
    })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(
      await screen.findByText(
        'Non ho trovato distributori vicini con Benzina Self disponibile.',
      ),
    ).toBeTruthy()
    expect(
      screen.queryByRole('link', { name: 'Apri nel navigatore' }),
    ).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('does not show a comparison when only one station is ranked', async () => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          name: 'Only Station',
          brand: 'Brand A',
          address: 'Via A',
          city: 'Milano',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 1_000,
          fuelPrice: 1.6,
        },
      ],
    })
    arrangeApiResponse({
      routes: [
        {
          destinationIndex: 0,
          distanceMeters: 1_000,
          durationSeconds: 300,
        },
      ],
    })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(await screen.findByText('1. Only Station')).toBeTruthy()
    expect(
      screen.queryByText(/netti in più rispetto al secondo classificato/),
    ).toBeNull()
  })

  it.each([
    [
      'a descriptive name',
      { name: 'Stazione Centro', brand: 'Q8', city: 'Milano' },
      '1. Stazione Centro',
    ],
    [
      'the brand when the name is numeric',
      { name: ' 7412 ', brand: 'Q8', city: 'Milano' },
      '1. Q8',
    ],
    [
      'the city fallback when the numeric name has no brand',
      { name: '7412', brand: null, city: 'Milano' },
      '1. Distributore a Milano',
    ],
    [
      'the generic fallback when no descriptive data is available',
      { name: '7412', brand: '   ', city: null },
      '1. Distributore',
    ],
  ])('shows %s', async (_case, stationLabels, expectedHeading) => {
    arrangeApiResponse({
      stations: [
        {
          id: 1,
          ...stationLabels,
          address: 'Via A',
          latitude: 45.47,
          longitude: 9.18,
          distanceMeters: 1_000,
          fuelPrice: 1.6,
        },
      ],
    })
    arrangeApiResponse({
      routes: [
        {
          destinationIndex: 0,
          distanceMeters: 1_000,
          durationSeconds: 300,
        },
      ],
    })
    render(<FuelSmartCalculator />)

    submitForm()

    expect(await screen.findByText(expectedHeading)).toBeTruthy()
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
