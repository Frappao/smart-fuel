// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ResultsMapProvider, useResultsMap } from './ResultsMapContext'
import { HomepageRightColumn } from './StationsResultMap'

function TestMapTrigger({ mode }: { mode: 'nearby' | 'trip' }) {
  const map = useResultsMap()
  return (
    <button
      type="button"
      onClick={() =>
        map?.setMapData({
          mode,
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

  function renderColumn(mode: 'nearby' | 'trip') {
    render(
      <ResultsMapProvider>
        <TestMapTrigger mode={mode} />
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
  }

  it('keeps the guide for nearby results, whose map lives in the full-width results view', () => {
    renderColumn('nearby')

    fireEvent.click(screen.getByRole('button', { name: 'Simula risultati' }))

    expect(
      screen.getByText('Il prezzo più basso non è sempre la scelta migliore'),
    ).toBeTruthy()
    expect(screen.queryByText(/Distributori calcolati/)).toBeNull()
  })

  it('shows the static guide before calculation and replaces it with the map after a trip calculation', () => {
    render(
      <ResultsMapProvider>
        <TestMapTrigger mode="trip" />
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
    // Il vincitore ha già la sua scheda nei risultati: sotto la mappa compare
    // solo il selettore, senza ripetere il dettaglio.
    expect(
      screen.getAllByRole('button', { name: /#1 Q8/ }).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('#1 in classifica')).toBeNull()
  })
})
