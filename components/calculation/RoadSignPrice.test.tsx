// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { buildWinnerInsight, RoadSignPrice, splitRoadSignPrice } from './RoadSignPrice'

describe('RoadSignPrice & buildWinnerInsight', () => {
  afterEach(() => {
    cleanup()
  })

  it('splits a 3-decimal Italian price into main and millesimi superscript', () => {
    expect(splitRoadSignPrice(1.759)).toEqual({
      main: '1,75',
      millesimi: '9',
      fullText: '1,759',
    })

    const { container } = render(<RoadSignPrice price={1.759} />)
    expect(container.textContent).toBe('1,759')
    expect(container.querySelector('sup')?.textContent).toBe('9')
  })

  it('explains why a station with a higher nominal price wins thanks to shorter road distance', () => {
    const insight = buildWinnerInsight([
      {
        station: {
          id: 1,
          name: 'Q8 Viale Monza',
          brand: 'Q8',
          city: 'Milano',
          fuelPrice: 1.789,
        },
        netFuelLiters: 27.65,
        travelDistanceKm: 2.0,
      },
      {
        station: {
          id: 2,
          name: 'Conad Lontano',
          brand: 'Conad',
          city: 'Monza',
          fuelPrice: 1.729,
        },
        netFuelLiters: 26.8,
        travelDistanceKm: 22.0,
      },
    ])

    expect(insight).not.toBeNull()
    expect(insight?.badge).toBe('La dritta di Rifornio')
    expect(insight?.message).toContain('Costa 6,0 cent/L in più di Conad Lontano')
    expect(insight?.message).toContain('evitando 20,0 km di strada extra A/R')
  })

  it('shows the pump vs travel breakdown and keeps the insight even when #1 and #2 tie on rounded net liters', () => {
    const insight = buildWinnerInsight([
      {
        station: {
          id: 1,
          name: 'ENI',
          brand: 'Agip Eni',
          city: 'Saronno',
          fuelPrice: 1.995,
        },
        litersPurchased: 50.125,
        travelFuelLiters: 0.04,
        netFuelLiters: 50.085,
        travelDistanceKm: 0.6,
      },
      {
        station: {
          id: 2,
          name: 'Agip Eni 2',
          brand: 'Agip Eni',
          city: 'Saronno',
          fuelPrice: 1.99,
        },
        litersPurchased: 50.251,
        travelFuelLiters: 0.168,
        netFuelLiters: 50.083,
        travelDistanceKm: 2.5,
      },
      {
        station: {
          id: 3,
          name: 'SOLARO-S.S. BUSTESE VIA VARESE 216',
          brand: 'Q8',
          city: 'Solaro',
          fuelPrice: 1.989,
        },
        litersPurchased: 50.276,
        travelFuelLiters: 0.613,
        netFuelLiters: 49.663,
        travelDistanceKm: 9.1,
      },
    ])

    expect(insight).not.toBeNull()
    expect(insight?.badge).toBe('La dritta di Rifornio')
    expect(insight?.message).toContain('+0,30 € alla pompa su questo importo')
    expect(insight?.message).toContain('non bruci 1,14 € di carburante nel tragitto')
    expect(insight?.message).toContain('risparmi davvero circa 0,84 € sul pieno')
  })

  it('returns null when only one station is available or advantage is rounded away', () => {
    expect(
      buildWinnerInsight([
        {
          station: {
            id: 1,
            name: 'Solo',
            brand: 'Eni',
            city: 'Milano',
            fuelPrice: 1.75,
          },
          netFuelLiters: 28,
          travelDistanceKm: 2,
        },
      ]),
    ).toBeNull()

    expect(screen).toBeDefined()
  })
})
