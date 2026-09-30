// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchGeocodingResults,
  fetchTripStations,
} from '../../lib/api/rifornioApiClient'
import { getMobileCurrentPosition } from './location/getMobileCurrentPosition'
import MobileTripCalculator from './MobileTripCalculator'
import { openTripNavigation } from './navigation/openStationNavigation'

vi.mock('../../lib/api/rifornioApiClient', () => ({
  fetchGeocodingResults: vi.fn(),
  fetchTripStations: vi.fn(),
}))
vi.mock('./location/getMobileCurrentPosition', () => ({
  getMobileCurrentPosition: vi.fn(),
}))
vi.mock('./navigation/openStationNavigation', () => ({
  openTripNavigation: vi.fn(),
}))

const destination = {
  id: 'bologna',
  label: 'Bologna, Emilia-Romagna, Italia',
  latitude: 44.4949,
  longitude: 11.3426,
}
const result = {
  station: {
    id: 1,
    mimitId: 101,
    name: 'Stazione percorso',
    brand: null,
    address: null,
    city: 'Parma',
    province: 'PR',
    latitude: 44.8015,
    longitude: 10.3279,
    distanceMeters: 200,
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

describe('MobileTripCalculator', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getMobileCurrentPosition).mockResolvedValue({
      latitude: 45.5,
      longitude: 9.2,
      accuracy: 20,
    })
    vi.mocked(openTripNavigation).mockResolvedValue()
  })

  afterEach(() => {
    cleanup()
  })

  it('uses native location, the production API, and trip navigation', async () => {
    vi.mocked(fetchGeocodingResults).mockResolvedValue({
      results: [destination],
    })
    vi.mocked(fetchTripStations).mockResolvedValue({
      baseRouteDistanceMeters: 214_000,
      results: [result],
    })
    render(<MobileTripCalculator onSelectNearby={vi.fn()} />)

    const destinationInput = screen.getByLabelText('Destinazione')
    fireEvent.change(destinationInput, { target: { value: 'Bologna' } })
    fireEvent.click(destinationInput.parentElement!.querySelector('button')!)
    fireEvent.click(await screen.findByLabelText(destination.label))
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Trova distributore sul percorso' }),
    )

    expect(await screen.findByText('1. Stazione percorso')).toBeTruthy()
    expect(fetchGeocodingResults).toHaveBeenCalledWith(
      'Bologna',
      'https://rifornio.it',
    )
    expect(fetchTripStations).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: { latitude: 45.5, longitude: 9.2 },
        destination: { latitude: 44.4949, longitude: 11.3426 },
      }),
      'https://rifornio.it',
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Apri percorso con questa sosta' }),
    )
    expect(openTripNavigation).toHaveBeenCalledWith({
      origin: { latitude: 45.5, longitude: 9.2 },
      destination: { latitude: 44.4949, longitude: 11.3426 },
      station: { latitude: 44.8015, longitude: 10.3279 },
    })
  })

  it('returns to nearby mode only when that option is selected', () => {
    const onSelectNearby = vi.fn()
    render(<MobileTripCalculator onSelectNearby={onSelectNearby} />)

    fireEvent.click(screen.getByRole('button', { name: 'Lungo un percorso' }))
    expect(onSelectNearby).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Vicino a me' }))
    expect(onSelectNearby).toHaveBeenCalledOnce()
  })
})
