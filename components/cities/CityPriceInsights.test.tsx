// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { CityPriceInsights } from './CityPriceInsights'
import { buildCityPriceTrend } from '../../lib/stations/cityPriceTrend'

const benzinaStats = { min: 1.75, avg: 1.85, max: 1.95, stationCount: 12 }

describe('CityPriceInsights', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders nothing without stats and history', () => {
    const { container } = render(<CityPriceInsights cityName="Roma" stats={{}} history={{}} />)
    expect(container.innerHTML).toBe('')
  })

  test('shows the full-tank saving from current prices without history', () => {
    render(<CityPriceInsights cityName="Roma" stats={{ benzinaSelf: benzinaStats }} history={{}} />)

    expect(screen.getByRole('heading', { name: 'Quanto si risparmia a Roma' })).toBeTruthy()
    expect(screen.getByText('5,00 €')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Andamento dei prezzi/ })).toBeNull()
  })

  test('shows the trend chart when history is available', () => {
    const trend = buildCityPriceTrend('benzina_self', [
      { date: '2026-11-01', avg: 1.8, min: 1.7 },
      { date: '2026-11-10', avg: 1.85, min: 1.75 },
    ])!

    render(
      <CityPriceInsights
        cityName="Roma"
        stats={{ benzinaSelf: benzinaStats }}
        history={{ benzina_self: trend }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Andamento dei prezzi a Roma' })).toBeTruthy()
    expect(screen.getByRole('img', { name: /Benzina self: media da 1,800 a 1,850/ })).toBeTruthy()
    expect(screen.getByText('7 giorni: +0,050 €/L')).toBeTruthy()
    expect(screen.getByText(/salita/)).toBeTruthy()
  })
})
