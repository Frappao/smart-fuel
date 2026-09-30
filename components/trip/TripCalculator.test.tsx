// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchGeocodingResults,
  fetchTripStations,
} from '../../lib/api/rifornioApiClient'
import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import TripCalculator from './TripCalculator'

vi.mock('../../lib/api/rifornioApiClient', () => ({
  fetchGeocodingResults: vi.fn(),
  fetchTripStations: vi.fn(),
}))
vi.mock('../../lib/location/getCurrentPosition', () => ({
  getCurrentPosition: vi.fn(),
}))

const milano = {
  id: 'milano',
  label: 'Milano, Lombardia, Italia',
  latitude: 45.4642,
  longitude: 9.19,
}
const bologna = {
  id: 'bologna',
  label: 'Bologna, Emilia-Romagna, Italia',
  latitude: 44.4949,
  longitude: 11.3426,
}

function searchAndSelect(label: string, resultLabel: string) {
  const input = screen.getByLabelText(label)
  fireEvent.change(input, { target: { value: resultLabel.split(',')[0] } })
  const searchButton = input.parentElement?.querySelector('button')

  if (!searchButton) throw new Error(`Missing search button for ${label}`)

  fireEvent.click(searchButton)
}

function fillRefuelData() {
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Importo rifornimento in euro' }),
    { target: { value: '50' } },
  )
  fireEvent.change(
    screen.getByRole('spinbutton', {
      name: 'Consumo medio auto in L/100 km',
    }),
    { target: { value: '6' } },
  )
}

function tripResult() {
  return {
    station: {
      id: 1,
      mimitId: 101,
      name: 'Stazione percorso',
      brand: null,
      address: 'Via Emilia 1',
      city: 'Parma',
      province: 'PR',
      latitude: 44.8015,
      longitude: 10.3279,
      distanceMeters: 250,
      fuelPrice: 1.7,
      communicatedAt: null,
    },
    originToStationDistanceMeters: 110_000,
    stationToDestinationDistanceMeters: 105_000,
    routeViaStationDistanceMeters: 215_000,
    detourDistanceMeters: 1_000,
    litersPurchased: 29.4118,
    detourFuelLiters: 0.06,
    netFuelLiters: 29.3518,
  }
}

describe('TripCalculator', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getCurrentPosition).mockResolvedValue({
      latitude: 45.5,
      longitude: 9.2,
      accuracy: 20,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('uses the current position and renders route-aware results', async () => {
    vi.mocked(fetchGeocodingResults).mockResolvedValue({ results: [bologna] })
    vi.mocked(fetchTripStations).mockResolvedValue({
      baseRouteDistanceMeters: 214_000,
      results: [tripResult()],
    })
    render(<TripCalculator />)

    searchAndSelect('Destinazione', bologna.label)
    fireEvent.click(await screen.findByLabelText(bologna.label))
    fillRefuelData()
    fireEvent.click(
      screen.getByRole('button', { name: 'Trova distributore sul percorso' }),
    )

    expect(await screen.findByText('1. Stazione percorso')).toBeTruthy()
    expect(getCurrentPosition).toHaveBeenCalledOnce()
    expect(fetchTripStations).toHaveBeenCalledWith({
      origin: { latitude: 45.5, longitude: 9.2 },
      destination: { latitude: 44.4949, longitude: 11.3426 },
      refuelAmount: 50,
      consumptionLitersPer100Km: 6,
      fuelType: 'Benzina',
      isSelf: true,
    })
    expect(screen.getByText('Percorso base stimato: 214,0 km')).toBeTruthy()
    expect(screen.getByText('Deviazione aggiuntiva: 1,0 km')).toBeTruthy()
    expect(screen.getByText('Carburante per la deviazione: 0,06 L')).toBeTruthy()

    const navigationUrl = new URL(
      screen
        .getByRole('link', { name: 'Apri percorso con questa sosta' })
        .getAttribute('href') ?? '',
    )
    expect(navigationUrl.searchParams.get('origin')).toBe('45.5,9.2')
    expect(navigationUrl.searchParams.get('destination')).toBe(
      '44.4949,11.3426',
    )
    expect(navigationUrl.searchParams.get('waypoints')).toBe(
      '44.8015,10.3279',
    )
  })

  it('uses a selected custom origin without requesting device location', async () => {
    vi.mocked(fetchGeocodingResults)
      .mockResolvedValueOnce({ results: [milano] })
      .mockResolvedValueOnce({ results: [bologna] })
    vi.mocked(fetchTripStations).mockResolvedValue({
      baseRouteDistanceMeters: 214_000,
      results: [],
    })
    render(<TripCalculator />)

    fireEvent.click(screen.getByLabelText("Scegli un'altra partenza"))
    searchAndSelect('Località di partenza', milano.label)
    fireEvent.click(await screen.findByLabelText(milano.label))
    searchAndSelect('Destinazione', bologna.label)
    fireEvent.click(await screen.findByLabelText(bologna.label))
    fillRefuelData()
    fireEvent.click(
      screen.getByRole('button', { name: 'Trova distributore sul percorso' }),
    )

    expect(
      await screen.findByText(
        'Non ho trovato distributori compatibili lungo questo percorso.',
      ),
    ).toBeTruthy()
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(fetchTripStations).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: { latitude: 45.4642, longitude: 9.19 },
        destination: { latitude: 44.4949, longitude: 11.3426 },
      }),
    )
  })

  it('requires explicit location selections before calculating', () => {
    render(<TripCalculator />)
    fillRefuelData()
    fireEvent.click(
      screen.getByRole('button', { name: 'Trova distributore sul percorso' }),
    )

    expect(screen.getByRole('alert').textContent).toBe(
      'Cerca e seleziona una destinazione.',
    )
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(fetchTripStations).not.toHaveBeenCalled()
  })
})
