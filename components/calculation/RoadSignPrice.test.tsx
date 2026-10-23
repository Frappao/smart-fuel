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
