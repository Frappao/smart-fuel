// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ResultsMapProvider, useResultsMap } from './ResultsMapContext'
import { HomepageRightColumn } from './StationsResultMap'

function TestMapTrigger() {
  const map = useResultsMap()
  return (
    <button
      type="button"
      onClick={() =>
        map?.setMapData({
          mode: 'nearby',
          fuelType: 'Benzina',
          isSelf: true,
          origin: { latitude: 45.4642, longitude: 9.19 },
          stations: [
            {
              id: 10,
              rank: 1,
              displayName: 'Q8 Saronno',
              brand: 'Q8',
              address: 'Via Varese 12',
              city: 'Saronno',
              latitude: 45.625,
              longitude: 9.035,
              fuelPrice: 1.749,
              netFuelLiters: 28.4,
              travelDistanceKm: 2.4,
              travelFuelLiters: 0.18,
              navigationHref:
                'https://www.google.com/maps/dir/?api=1&destination=45.625,9.035&travelmode=driving&dir_action=navigate',
              navigationLabel: 'Apri nel navigatore',
              distanceSummary: 'Distanza A/R: 2,4 km',
            },
          ],
        })
      }
    >
      Simula risultati
    </button>
  )
}

describe('HomepageRightColumn & StationsResultMap', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the static guide before calculation and replaces it with the map after calculation', () => {
    render(
      <ResultsMapProvider>
        <TestMapTrigger />
        <HomepageRightColumn
          defaultGuide={
            <section aria-labelledby="homepage-guide-title">
              <h2 id="homepage-guide-title">
                Il prezzo più basso non è sempre la scelta migliore
              </h2>
            </section>
          }
        />
      </ResultsMapProvider>,
    )

    expect(
      screen.getByText('Il prezzo più basso non è sempre la scelta migliore'),
    ).toBeTruthy()
    expect(screen.queryByText(/Distributori calcolati/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Simula risultati' }))

    expect(
      screen.queryByText('Il prezzo più basso non è sempre la scelta migliore'),
    ).toBeNull()
    expect(screen.getByText('Distributori calcolati (1)')).toBeTruthy()
    expect(screen.getByText('Q8 Saronno')).toBeTruthy()
  })
})
